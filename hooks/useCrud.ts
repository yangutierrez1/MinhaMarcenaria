import { useState } from 'react';

export function useCrud<T>(initialData: T) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<T>(initialData);

  const openNew = () => {
    setEditingId(null);
    setFormData(initialData);
    setIsOpen(true);
  };

  const openEdit = (id: string, data: T) => {
    setEditingId(id);
    setFormData(data);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData(initialData);
  };

  const updateField = (field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    isOpen,
    editingId,
    formData,
    openNew,
    openEdit,
    close,
    updateField,
    setFormData
  };
}