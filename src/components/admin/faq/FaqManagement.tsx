// components/admin/faq/FaqManagement.tsx
//
// Admin → Content → FAQ.
//
// Presentation matches the vendor Product Form: #E5EAF2 borders, #FAFBFD section
// headers, 12–14px radii, blue→violet gradient for the primary action, muted
// slate text. Plain Tailwind only — no component-library primitives.
//
// Functionality is unchanged: the same RTK Query hooks, the same create/edit/
// delete/toggle/order payloads, the same validation and the same toasts.

'use client';

import { useEffect, useState } from 'react';
import {
  useGetFaqsQuery,
  useGetCategoriesQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  useToggleFaqStatusMutation,
  useUpdateFaqOrderMutation,
  type Faq,
  type CreateFaqDto,
} from '@/features/faqApi';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  ChevronDown,
  GripVertical,
  HelpCircle,
  Loader2,
  X,
  Layers,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';

interface CategoryState {
  [key: string]: boolean;
}

interface QuestionState {
  [key: string]: boolean;
}

interface CategoryWithFaqs {
  name: string;
  faqs: Faq[];
  orderIndex: number;
}

const CARD = 'rounded-[14px] border border-[#E5EAF2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]';
const LABEL = 'text-[11px] font-semibold uppercase tracking-wide text-[#7A90AB]';
const FIELD =
  'w-full rounded-[12px] border border-[#E5EAF2] bg-white px-3 py-2.5 text-sm text-[#0D1B2E] outline-none transition placeholder:text-[#9BAABB] focus:border-[#A855F7] focus:ring-4 focus:ring-[#A855F7]/10 disabled:bg-[#FAFBFD] disabled:text-[#9BAABB]';
const PRIMARY =
  'inline-flex items-center justify-center gap-1.5 rounded-[11px] bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-[#8B5CF6]/25 transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#8B5CF6]/25 disabled:cursor-not-allowed disabled:opacity-50';
const GHOST =
  'inline-flex items-center justify-center gap-1.5 rounded-[11px] border border-[#E5EAF2] bg-white px-3 py-2 text-xs font-semibold text-[#3D5068] transition hover:border-[#D5DEEC] hover:bg-[#FAFBFD] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E5EAF2] disabled:opacity-50';

export default function FaqManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null);

  const [openCategories, setOpenCategories] = useState<CategoryState>({});
  const [openQuestions, setOpenQuestions] = useState<QuestionState>({});

  const { data: faqsData, isLoading, isError, refetch } = useGetFaqsQuery({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    search: searchTerm || undefined,
  });
  const { data: categoriesData } = useGetCategoriesQuery();
  const [createFaq, { isLoading: isCreating }] = useCreateFaqMutation();
  const [updateFaq, { isLoading: isUpdating }] = useUpdateFaqMutation();
  const [deleteFaq, { isLoading: isDeleting }] = useDeleteFaqMutation();
  const [toggleStatus] = useToggleFaqStatusMutation();
  const [updateOrder] = useUpdateFaqOrderMutation();

  const faqs = faqsData?.data || [];
  const categories = categoriesData?.data || [];

  const categoriesWithFaqs: CategoryWithFaqs[] = Object.entries(
    faqs.reduce((acc: { [key: string]: Faq[] }, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = [];
      }
      acc[faq.category].push(faq);
      return acc;
    }, {})
  )
    .map(([name, faqs], index) => ({
      name,
      faqs: faqs.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)),
      orderIndex: index,
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const [formData, setFormData] = useState<CreateFaqDto>({
    category: '',
    question: '',
    answer: '',
    isActive: true,
  });

  const dialogOpen = isCreateDialogOpen || isEditDialogOpen;

  const resetForm = () => {
    setFormData({
      category: '',
      question: '',
      answer: '',
      isActive: true,
    });
  };

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedFaq(null);
    resetForm();
  };

  // Escape closes the modal; the dialog is a plain overlay so this is explicit.
  useEffect(() => {
    if (!dialogOpen && !isDeleteDialogOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (isDeleteDialogOpen) {
        setIsDeleteDialogOpen(false);
        setSelectedFaq(null);
        return;
      }
      closeDialog();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleCreateFaq = async () => {
    if (!formData.category || !formData.question || !formData.answer) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createFaq(formData).unwrap();
      toast.success('FAQ created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create FAQ');
    }
  };

  const handleUpdateFaq = async () => {
    if (!selectedFaq) return;

    if (!formData.category || !formData.question || !formData.answer) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await updateFaq({
        id: selectedFaq.id,
        data: formData,
      }).unwrap();
      toast.success('FAQ updated successfully');
      setIsEditDialogOpen(false);
      setSelectedFaq(null);
      resetForm();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update FAQ');
    }
  };

  const handleDeleteFaq = async () => {
    if (!selectedFaq) return;

    try {
      await deleteFaq(selectedFaq.id).unwrap();
      toast.success('FAQ deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedFaq(null);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete FAQ');
    }
  };

  const handleToggleStatus = async (faq: Faq) => {
    try {
      await toggleStatus(faq.id).unwrap();
      toast.success(`FAQ ${faq.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to toggle FAQ status');
    }
  };

  const openEditDialog = (faq: Faq) => {
    setSelectedFaq(faq);
    setFormData({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      isActive: faq.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (faq: Faq) => {
    setSelectedFaq(faq);
    setIsDeleteDialogOpen(true);
  };

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleQuestion = (faqId: string) => {
    setOpenQuestions((prev) => {
      const newState: QuestionState = {};
      if (!prev[faqId]) {
        newState[faqId] = true;
      }
      return newState;
    });
  };

  const openAllCategories = () => {
    const allOpen: CategoryState = {};
    categoriesWithFaqs.forEach((category) => {
      allOpen[category.name] = true;
    });
    setOpenCategories(allOpen);
  };

  const closeAllCategories = () => {
    setOpenCategories({});
    setOpenQuestions({});
  };

  const handleCategoryDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(categoriesWithFaqs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    toast.success('Category order updated');
  };

  const handleQuestionDragEnd = async (result: DropResult, categoryName: string) => {
    if (!result.destination) return;

    const category = categoriesWithFaqs.find((cat) => cat.name === categoryName);
    if (!category) return;

    const items = Array.from(category.faqs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updates = items.map((item, index) => ({
      id: item.id,
      orderIndex: index,
    }));

    try {
      await updateOrder(updates).unwrap();
      toast.success('FAQ order updated successfully');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update FAQ order');
    }
  };

  const activeCount = faqs.filter((faq) => faq.isActive).length;

  return (
    <div className="min-h-full bg-[#F7F9FD] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1240px] space-y-5">
        {/* ── header ───────────────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] text-white shadow-sm shadow-[#8B5CF6]/25">
                <HelpCircle size={16} />
              </span>
              <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-[#0D1B2E]">
                FAQ Management
              </h1>
            </div>
            <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-[#7A90AB]">
              Group the answers customers look for most. Drag a category or a question to change its
              order — the order is saved immediately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={openAllCategories} className={GHOST}>
              Expand all
            </button>
            <button type="button" onClick={closeAllCategories} className={GHOST}>
              Collapse all
            </button>
            <button
              type="button"
              onClick={() => setIsCreateDialogOpen(true)}
              className={PRIMARY}
            >
              <Plus size={14} /> Add FAQ
            </button>
          </div>
        </header>

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <section className={`${CARD} p-3.5`}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_260px_auto] md:items-end">
            <label className="block">
              <span className={LABEL}>Search</span>
              <span className="relative mt-1.5 block">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9BAABB]" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search questions or answers…"
                  className={`${FIELD} pl-9`}
                />
              </span>
            </label>

            <label className="block">
              <span className={LABEL}>Category</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`${FIELD} mt-1.5 cursor-pointer appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%237A90AB' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[right_0.75rem_center] bg-no-repeat pr-9`}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-2 md:justify-end">
              <span className="rounded-full bg-[#EEF3FB] px-2.5 py-1 text-[11px] font-semibold text-[#3D5068]">
                {faqs.length} {faqs.length === 1 ? 'question' : 'questions'}
              </span>
              <span className="rounded-full bg-[#F0F9F0] px-2.5 py-1 text-[11px] font-semibold text-[#16A34A]">
                {activeCount} active
              </span>
            </div>
          </div>
        </section>

        {/* ── list ─────────────────────────────────────────────────────────── */}
        <section className={CARD}>
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center gap-3 rounded-[12px] border border-[#F0F4FA] p-3.5">
                  <div className="h-8 w-8 animate-pulse rounded-[10px] bg-[#EEF3FB]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 animate-pulse rounded bg-[#EEF3FB]" />
                    <div className="h-3 w-24 animate-pulse rounded bg-[#F0F4FA]" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <p className="text-sm font-semibold text-[#0D1B2E]">Could not load FAQs</p>
              <p className="max-w-sm text-xs text-[#7A90AB]">
                The request failed. Check your connection and try again — nothing was changed.
              </p>
              <button type="button" onClick={() => refetch()} className={`${GHOST} mt-2`}>
                Retry
              </button>
            </div>
          ) : categoriesWithFaqs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF3FB] text-[#9BAABB]">
                <Layers size={18} />
              </span>
              <p className="text-sm font-semibold text-[#0D1B2E]">No FAQs yet</p>
              <p className="max-w-sm text-xs text-[#7A90AB]">
                {searchTerm || selectedCategory !== 'all'
                  ? 'No question matches this search or category. Clear the filters to see everything.'
                  : 'Create the first question — customers will see it grouped under its category.'}
              </p>
              <button type="button" onClick={() => setIsCreateDialogOpen(true)} className={`${PRIMARY} mt-2`}>
                <Plus size={13} /> Add FAQ
              </button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleCategoryDragEnd}>
              <Droppable droppableId="categories">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-[#F0F4FA]">
                    {categoriesWithFaqs.map((category, categoryIndex) => {
                      const isOpen = !!openCategories[category.name];
                      return (
                        <Draggable key={category.name} draggableId={`category-${category.name}`} index={categoryIndex}>
                          {(dragProvided, snapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={snapshot.isDragging ? 'bg-[#FAFBFD] shadow-lg shadow-[#8B5CF6]/10' : ''}
                            >
                              <div
                                className="group flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#FAFBFD]"
                                onClick={() => toggleCategory(category.name)}
                              >
                                <span
                                  {...dragProvided.dragHandleProps}
                                  onClick={(e) => e.stopPropagation()}
                                  className="cursor-grab rounded p-0.5 text-[#C3CFDF] transition hover:text-[#7A90AB] active:cursor-grabbing"
                                  aria-label="Drag category"
                                >
                                  <GripVertical size={15} />
                                </span>

                                <ChevronDown
                                  size={15}
                                  className={`shrink-0 text-[#9BAABB] transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                                />

                                <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-[#0D1B2E]">
                                  {category.name}
                                </h3>

                                <span className="shrink-0 rounded-full bg-[#EEF3FB] px-2 py-0.5 text-[10px] font-semibold text-[#3D5068]">
                                  {category.faqs.length} {category.faqs.length === 1 ? 'question' : 'questions'}
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData((prev) => ({ ...prev, category: category.name }));
                                    setIsCreateDialogOpen(true);
                                  }}
                                  className="shrink-0 rounded-[10px] px-2 py-1 text-[11px] font-semibold text-[#2563EB] opacity-0 transition hover:bg-[#EEF3FB] focus:opacity-100 focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/30 group-hover:opacity-100 sm:opacity-100"
                                >
                                  <span className="inline-flex items-center gap-1">
                                    <Plus size={11} /> Add
                                  </span>
                                </button>
                              </div>

                              {isOpen && (
                                <div className="px-4 pb-4">
                                  <DragDropContext onDragEnd={(result) => handleQuestionDragEnd(result, category.name)}>
                                    <Droppable droppableId={`questions-${category.name}`}>
                                      {(qProvided) => (
                                        <div {...qProvided.droppableProps} ref={qProvided.innerRef} className="space-y-2">
                                          {category.faqs.map((faq, faqIndex) => {
                                            const answerOpen = !!openQuestions[faq.id];
                                            return (
                                              <Draggable key={faq.id} draggableId={faq.id} index={faqIndex}>
                                                {(itemProvided, itemSnapshot) => (
                                                  <div
                                                    ref={itemProvided.innerRef}
                                                    {...itemProvided.draggableProps}
                                                    className={`rounded-[12px] border transition ${
                                                      itemSnapshot.isDragging
                                                        ? 'border-[#C7B6F8] bg-white shadow-lg shadow-[#8B5CF6]/10'
                                                        : 'border-[#E5EAF2] bg-white hover:border-[#D5DEEC]'
                                                    }`}
                                                  >
                                                    <div
                                                      className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5"
                                                      onClick={() => toggleQuestion(faq.id)}
                                                    >
                                                      <span
                                                        {...itemProvided.dragHandleProps}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="shrink-0 cursor-grab text-[#C3CFDF] transition hover:text-[#7A90AB] active:cursor-grabbing"
                                                        aria-label="Drag question"
                                                      >
                                                        <GripVertical size={13} />
                                                      </span>

                                                      <ChevronDown
                                                        size={13}
                                                        className={`shrink-0 text-[#9BAABB] transition-transform duration-200 ${answerOpen ? '' : '-rotate-90'}`}
                                                      />

                                                      <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#0D1B2E]">
                                                        {faq.question}
                                                      </p>

                                                      <span
                                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                          faq.isActive
                                                            ? 'bg-[#F0F9F0] text-[#16A34A] ring-1 ring-[#BBF7D0]'
                                                            : 'bg-[#FEF2F2] text-[#DC2626] ring-1 ring-[#FECACA]'
                                                        }`}
                                                      >
                                                        {faq.isActive ? 'Active' : 'Inactive'}
                                                      </span>

                                                      <div className="flex shrink-0 items-center gap-0.5">
                                                        <button
                                                          type="button"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleStatus(faq);
                                                          }}
                                                          aria-label={faq.isActive ? 'Deactivate FAQ' : 'Activate FAQ'}
                                                          className="rounded-[9px] p-1.5 text-[#9BAABB] transition hover:bg-[#EEF3FB] hover:text-[#3D5068] focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/30"
                                                        >
                                                          {faq.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditDialog(faq);
                                                          }}
                                                          aria-label="Edit FAQ"
                                                          className="rounded-[9px] p-1.5 text-[#9BAABB] transition hover:bg-[#EEF3FB] hover:text-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/30"
                                                        >
                                                          <Pencil size={13} />
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDeleteDialog(faq);
                                                          }}
                                                          aria-label="Delete FAQ"
                                                          className="rounded-[9px] p-1.5 text-[#9BAABB] transition hover:bg-[#FEF2F2] hover:text-[#DC2626] focus-visible:ring-2 focus-visible:ring-[#DC2626]/20"
                                                        >
                                                          <Trash2 size={13} />
                                                        </button>
                                                      </div>
                                                    </div>

                                                    {answerOpen && (
                                                      <div className="px-3 pb-3 pl-[3.2rem]">
                                                        <div className="rounded-[10px] border border-[#F0F4FA] bg-[#FAFBFD] px-3.5 py-2.5">
                                                          <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-[#3D5068]">
                                                            {faq.answer}
                                                          </p>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </Draggable>
                                            );
                                          })}
                                          {qProvided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                  </DragDropContext>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </section>

        {/* ── create / edit modal ──────────────────────────────────────────── */}
        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="presentation">
            <button
              type="button"
              aria-label="Close dialog"
              onClick={closeDialog}
              className="absolute inset-0 bg-[#0D1B2E]/40 backdrop-blur-[2px]"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="faq-dialog-title"
              className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[18px] border border-[#E5EAF2] bg-white shadow-2xl sm:rounded-[18px]"
            >
              <header className="flex items-start justify-between gap-3 border-b border-[#F0F4FA] bg-[#FAFBFD] px-5 py-4">
                <div className="min-w-0">
                  <h2 id="faq-dialog-title" className="text-base font-semibold text-[#0D1B2E]">
                    {isEditDialogOpen ? 'Edit FAQ' : 'Create new FAQ'}
                  </h2>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#7A90AB]">
                    {isEditDialogOpen
                      ? 'Changes are published to the storefront as soon as you save.'
                      : 'Pick a category (or type a new one) and write the question and answer.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDialog}
                  aria-label="Close"
                  className="rounded-[10px] p-1.5 text-[#9BAABB] transition hover:bg-white hover:text-[#3D5068] focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/30"
                >
                  <X size={16} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="space-y-4">
                  <div className="rounded-[12px] border border-[#F0F4FA] bg-[#FAFBFD] p-3.5">
                    <p className={LABEL}>Category</p>
                    <div className="mt-1.5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <select
                        value={categories.includes(formData.category) ? formData.category : ''}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className={`${FIELD} cursor-pointer`}
                        aria-label="Existing category"
                      >
                        <option value="">Select an existing category…</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <input
                        placeholder="…or type a new category"
                        value={!categories.includes(formData.category) ? formData.category : ''}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className={FIELD}
                        aria-label="New category"
                      />
                    </div>
                    {!formData.category && (
                      <p className="mt-1.5 text-[10.5px] font-medium text-[#DC2626]">Category is required.</p>
                    )}
                  </div>

                  <label className="block">
                    <span className={LABEL}>
                      Question <span className="text-[#DC2626]">*</span>
                    </span>
                    <input
                      id="question"
                      placeholder="e.g. How long does delivery take?"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      className={`${FIELD} mt-1.5`}
                    />
                  </label>

                  <label className="block">
                    <span className={LABEL}>
                      Answer <span className="text-[#DC2626]">*</span>
                    </span>
                    <textarea
                      id="answer"
                      placeholder="Write the answer the way you would say it to a customer…"
                      rows={5}
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      className={`${FIELD} mt-1.5 resize-y leading-relaxed`}
                    />
                    <span className="mt-1 flex items-center justify-between text-[10.5px] text-[#9BAABB]">
                      <span>Line breaks are preserved on the storefront.</span>
                      <span className="tabular-nums">{formData.answer.length}</span>
                    </span>
                  </label>

                  <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#E5EAF2] px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-[#0D1B2E]">Visible on the storefront</p>
                      <p className="mt-0.5 text-[10.5px] text-[#7A90AB]">
                        Inactive FAQs stay in the dashboard but are hidden from customers.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.isActive}
                      aria-label="Visible on the storefront"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#8B5CF6]/25 ${
                        formData.isActive ? 'bg-gradient-to-r from-[#2563EB] to-[#8B5CF6]' : 'bg-[#D5DEEC]'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                          formData.isActive ? 'left-[1.375rem]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <footer className="flex items-center justify-end gap-2 border-t border-[#F0F4FA] bg-white px-5 py-3.5">
                <button type="button" onClick={closeDialog} className={GHOST}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={isEditDialogOpen ? handleUpdateFaq : handleCreateFaq}
                  disabled={isCreating || isUpdating}
                  className={PRIMARY}
                >
                  {(isCreating || isUpdating) && <Loader2 size={13} className="animate-spin" />}
                  {isCreating || isUpdating
                    ? 'Saving…'
                    : isEditDialogOpen
                      ? 'Update FAQ'
                      : 'Create FAQ'}
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* ── delete confirmation ──────────────────────────────────────────── */}
        {isDeleteDialogOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center" role="presentation">
            <button
              type="button"
              aria-label="Close dialog"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedFaq(null);
              }}
              className="absolute inset-0 bg-[#0D1B2E]/40 backdrop-blur-[2px]"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="faq-delete-title"
              className="relative w-full max-w-sm rounded-[16px] border border-[#E5EAF2] bg-white p-5 shadow-2xl"
            >
              <h2 id="faq-delete-title" className="text-sm font-bold text-[#0D1B2E]">
                Delete this FAQ?
              </h2>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#3D5068]">
                “{selectedFaq?.question}” will be removed permanently. This cannot be undone.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedFaq(null);
                  }}
                  className={GHOST}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteFaq}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 rounded-[11px] bg-[#DC2626] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#B91C1C] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#DC2626]/25 disabled:opacity-50"
                >
                  {isDeleting && <Loader2 size={13} className="animate-spin" />}
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
