import type { StateCreator } from "zustand";
import type { MapDocument } from "@/viewer/types";

export interface DocumentSlice {
  /** 已加载的文档 */
  documents: Map<string, MapDocument>;

  /** 添加文档 */
  addDocument: (doc: MapDocument) => void;

  /** 移除文档 */
  removeDocument: (id: string) => void;

  /** 获取文档 */
  getDocument: (id: string) => MapDocument | undefined;

  /** 设置文档可见性 */
  setDocumentVisible: (id: string, visible: boolean) => void;
}

export const createDocumentSlice: StateCreator<
  DocumentSlice,
  [],
  [],
  DocumentSlice
> = (set, get) => ({
  documents: new Map(),

  addDocument: (doc) =>
    set((state) => {
      const newDocs = new Map(state.documents);
      newDocs.set(doc.id, doc);
      return { documents: newDocs };
    }),

  removeDocument: (id) =>
    set((state) => {
      const doc = state.documents.get(id);
      if (doc) {
        doc.renderer.dispose();
      }
      const newDocs = new Map(state.documents);
      newDocs.delete(id);
      return { documents: newDocs };
    }),

  getDocument: (id) => get().documents.get(id),

  setDocumentVisible: (id, visible) =>
    set((state) => {
      const doc = state.documents.get(id);
      if (doc) {
        doc.visible = visible;
        doc.renderer.setVisible(visible);
        const newDocs = new Map(state.documents);
        newDocs.set(id, { ...doc, visible });
        return { documents: newDocs };
      }
      return state;
    }),
});
