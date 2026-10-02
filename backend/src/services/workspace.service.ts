import crypto from 'node:crypto';
import { getDatabase } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  AuthenticatedUserPayload,
  CaseDocumentRecord,
  CaseWorkspaceRecord,
  DocumentUploadRequest,
  MessageCreateRequest,
  WorkspaceMessageRecord,
} from '../types/index.js';

export class WorkspaceService {
  private get db() {
    return getDatabase();
  }

  private checkWorkspaceAccess(workspaceId: string, user: AuthenticatedUserPayload): CaseWorkspaceRecord {
    const workspace = this.db
      .prepare('SELECT * FROM case_workspaces WHERE id = ?')
      .get(workspaceId) as CaseWorkspaceRecord | undefined;

    if (!workspace) {
      throw new AppError(404, 'NOT_FOUND', `Workspace not found for id: ${workspaceId}`);
    }

    if (user.role === 'admin') {
      return workspace;
    }

    if (user.role === 'client' && workspace.client_id === user.id) {
      return workspace;
    }

    if (user.role === 'advocate') {
      const advProfile = this.db
        .prepare('SELECT id FROM advocate_profiles WHERE user_id = ?')
        .get(user.id) as { id: string } | undefined;

      if (advProfile && advProfile.id === workspace.advocate_id) {
        return workspace;
      }
    }

    throw new AppError(403, 'FORBIDDEN', 'Access denied to this confidential case workspace');
  }

  public listWorkspaces(user: AuthenticatedUserPayload): CaseWorkspaceRecord[] {
    if (user.role === 'admin') {
      return this.db
        .prepare('SELECT * FROM case_workspaces ORDER BY created_at DESC')
        .all() as unknown as CaseWorkspaceRecord[];
    }

    if (user.role === 'advocate') {
      const advProfile = this.db
        .prepare('SELECT id FROM advocate_profiles WHERE user_id = ?')
        .get(user.id) as { id: string } | undefined;

      if (!advProfile) {
        return [];
      }

      return this.db
        .prepare('SELECT * FROM case_workspaces WHERE advocate_id = ? ORDER BY created_at DESC')
        .all(advProfile.id) as unknown as CaseWorkspaceRecord[];
    }

    // Client
    return this.db
      .prepare('SELECT * FROM case_workspaces WHERE client_id = ? ORDER BY created_at DESC')
      .all(user.id) as unknown as CaseWorkspaceRecord[];
  }

  public getWorkspace(id: string, user: AuthenticatedUserPayload): CaseWorkspaceRecord {
    return this.checkWorkspaceAccess(id, user);
  }

  public listDocuments(workspaceId: string, user: AuthenticatedUserPayload): CaseDocumentRecord[] {
    this.checkWorkspaceAccess(workspaceId, user);

    const rows = this.db
      .prepare('SELECT * FROM case_documents WHERE workspace_id = ? ORDER BY created_at DESC')
      .all(workspaceId) as unknown as CaseDocumentRecord[];

    return rows.map((r) => ({
      ...r,
      file_size_bytes: Number(r.file_size_bytes),
    }));
  }

  public uploadDocument(
    workspaceId: string,
    user: AuthenticatedUserPayload,
    data: DocumentUploadRequest
  ): CaseDocumentRecord {
    this.checkWorkspaceAccess(workspaceId, user);

    const { file_name, file_url, file_size_bytes, mime_type } = data;

    if (!file_name || !file_url || !file_size_bytes || !mime_type) {
      throw new AppError(400, 'VALIDATION_FAILED', 'All document metadata fields are required');
    }

    if (file_size_bytes <= 0) {
      throw new AppError(400, 'VALIDATION_FAILED', 'file_size_bytes must be greater than 0');
    }

    const docId = `doc-${crypto.randomUUID()}`;

    this.db
      .prepare(`
        INSERT INTO case_documents (
          id, workspace_id, uploaded_by_user_id, file_name, file_url, file_size_bytes, mime_type, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      .run(docId, workspaceId, user.id, file_name, file_url, file_size_bytes, mime_type);

    return this.db
      .prepare('SELECT * FROM case_documents WHERE id = ?')
      .get(docId) as unknown as CaseDocumentRecord;
  }

  public listMessages(workspaceId: string, user: AuthenticatedUserPayload): WorkspaceMessageRecord[] {
    this.checkWorkspaceAccess(workspaceId, user);

    const rows = this.db
      .prepare('SELECT * FROM workspace_messages WHERE workspace_id = ? ORDER BY created_at ASC')
      .all(workspaceId) as unknown as Array<{
        id: string;
        workspace_id: string;
        sender_id: string;
        message_text: string;
        attachments: string;
        created_at: string;
      }>;

    return rows.map((r) => ({
      ...r,
      attachments: JSON.parse(r.attachments || '[]'),
    }));
  }

  public sendMessage(
    workspaceId: string,
    user: AuthenticatedUserPayload,
    data: MessageCreateRequest
  ): WorkspaceMessageRecord {
    this.checkWorkspaceAccess(workspaceId, user);

    const { message_text, attachments = [] } = data;

    if (!message_text || message_text.trim().length === 0) {
      throw new AppError(400, 'VALIDATION_FAILED', 'message_text cannot be empty');
    }

    const msgId = `msg-${crypto.randomUUID()}`;

    this.db
      .prepare(`
        INSERT INTO workspace_messages (
          id, workspace_id, sender_id, message_text, attachments, created_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      `)
      .run(msgId, workspaceId, user.id, message_text.trim(), JSON.stringify(attachments));

    const inserted = this.db
      .prepare('SELECT * FROM workspace_messages WHERE id = ?')
      .get(msgId) as {
        id: string;
        workspace_id: string;
        sender_id: string;
        message_text: string;
        attachments: string;
        created_at: string;
      };

    return {
      ...inserted,
      attachments: JSON.parse(inserted.attachments || '[]'),
    };
  }
}

export const workspaceService = new WorkspaceService();
