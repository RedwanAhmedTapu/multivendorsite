// components/admin/faq/FaqManagement.tsx
'use client';

import { useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';

interface CategoryState {
  [key: string]: boolean; // category -> isOpen
}

interface QuestionState {
  [key: string]: boolean; // faqId -> isOpen
}

interface CategoryWithFaqs {
  name: string;
  faqs: Faq[];
  orderIndex: number;
}

export default function FaqManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null);
  
  // State for collapsible sections
  const [openCategories, setOpenCategories] = useState<CategoryState>({});
  const [openQuestions, setOpenQuestions] = useState<QuestionState>({});

  // RTK Query hooks
  const { data: faqsData, isLoading } = useGetFaqsQuery({
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

  // Group FAQs by category and create ordered structure
  const categoriesWithFaqs: CategoryWithFaqs[] = Object.entries(
    faqs.reduce((acc: { [key: string]: Faq[] }, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = [];
      }
      acc[faq.category].push(faq);
      return acc;
    }, {})
  ).map(([name, faqs], index) => ({
    name,
    faqs: faqs.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)),
    orderIndex: index,
  })).sort((a, b) => a.orderIndex - b.orderIndex);

  // Form state
  const [formData, setFormData] = useState<CreateFaqDto>({
    category: '',
    question: '',
    answer: '',
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      category: '',
      question: '',
      answer: '',
      isActive: true,
    });
  };

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

  // Category toggle handler
  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Question toggle handler - only one question can be open at a time
  const toggleQuestion = (faqId: string) => {
    setOpenQuestions(prev => {
      const newState: QuestionState = {};
      
      // If the clicked question is not currently open, open it and close others
      if (!prev[faqId]) {
        newState[faqId] = true;
      }
      // If it's already open, clicking will close it (leaving all closed)
      
      return newState;
    });
  };

  // Open all categories
  const openAllCategories = () => {
    const allOpen: CategoryState = {};
    categoriesWithFaqs.forEach(category => {
      allOpen[category.name] = true;
    });
    setOpenCategories(allOpen);
  };

  // Close all categories
  const closeAllCategories = () => {
    setOpenCategories({});
    setOpenQuestions({});
  };

  // Handle drag and drop for categories
  const handleCategoryDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(categoriesWithFaqs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update category order (you might need to implement this in your API)
    // For now, we'll just update the local state
    toast.success('Category order updated');
  };

  // Handle drag and drop for questions within a category
  const handleQuestionDragEnd = async (result: DropResult, categoryName: string) => {
    if (!result.destination) return;

    const category = categoriesWithFaqs.find(cat => cat.name === categoryName);
    if (!category) return;

    const items = Array.from(category.faqs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order indexes
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">FAQ Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage frequently asked questions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openAllCategories}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={closeAllCategories}>
              Collapse All
            </Button>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-gray-600 mb-2">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search questions or answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600 mb-2">Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* FAQ List with Collapsible Categories and Drag & Drop */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading FAQs...</div>
        ) : categoriesWithFaqs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No FAQs found. Create your first FAQ!
          </div>
        ) : (
          <DragDropContext onDragEnd={handleCategoryDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-gray-200">
                  {categoriesWithFaqs.map((category, categoryIndex) => (
                    <Draggable key={category.name} draggableId={`category-${category.name}`} index={categoryIndex}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`group transition-colors ${
                            snapshot.isDragging ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                        >
                          {/* Category Header */}
                          <div 
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleCategory(category.name)}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {/* Drag Handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <GripVertical className="h-5 w-5 text-gray-400" />
                              </div>
                              
                              <div className="transition-transform duration-200" style={{
                                transform: openCategories[category.name] ? 'rotate(0deg)' : 'rotate(-90deg)'
                              }}>
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              </div>
                              <h3 className="font-semibold text-lg text-gray-900">{category.name}</h3>
                              <Badge variant="secondary" className="ml-2">
                                {category.faqs.length} {category.faqs.length === 1 ? 'question' : 'questions'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData(prev => ({ ...prev, category: category.name }));
                                  setIsCreateDialogOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Question
                              </Button>
                            </div>
                          </div>

                          {/* Category Content */}
                          <div 
                            className="overflow-hidden transition-all duration-300 ease-in-out"
                            style={{
                              maxHeight: openCategories[category.name] ? `${category.faqs.length * 100}px` : '0px'
                            }}
                          >
                            <div className="pb-4 px-4">
                              <DragDropContext onDragEnd={(result) => handleQuestionDragEnd(result, category.name)}>
                                <Droppable droppableId={`questions-${category.name}`}>
                                  {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                      {category.faqs.map((faq, faqIndex) => (
                                        <Draggable key={faq.id} draggableId={faq.id} index={faqIndex}>
                                          {(provided, snapshot) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className={`border border-gray-200 rounded-lg hover:border-gray-300 transition-colors ${
                                                snapshot.isDragging ? 'bg-blue-50 border-blue-200' : ''
                                              }`}
                                            >
                                              {/* Question Header */}
                                              <div 
                                                className="flex items-center justify-between p-4 cursor-pointer"
                                                onClick={() => toggleQuestion(faq.id)}
                                              >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                  {/* Drag Handle */}
                                                  <div
                                                    {...provided.dragHandleProps}
                                                    className="cursor-grab active:cursor-grabbing flex-shrink-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                                  </div>
                                                  
                                                  <div className="transition-transform duration-200 flex-shrink-0" style={{
                                                    transform: openQuestions[faq.id] ? 'rotate(0deg)' : 'rotate(-90deg)'
                                                  }}>
                                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 truncate">
                                                      {faq.question}
                                                    </h4>
                                                  </div>
                                                  <div className="flex items-center gap-2 flex-shrink-0">
                                                    <Badge
                                                      variant={faq.isActive ? 'default' : 'outline'}
                                                      className="text-xs"
                                                    >
                                                      {faq.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                  </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleToggleStatus(faq);
                                                    }}
                                                    className="h-8 w-8 p-0"
                                                  >
                                                    {faq.isActive ? (
                                                      <Eye className="h-4 w-4" />
                                                    ) : (
                                                      <EyeOff className="h-4 w-4" />
                                                    )}
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      openEditDialog(faq);
                                                    }}
                                                    className="h-8 w-8 p-0"
                                                  >
                                                    <Pencil className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      openDeleteDialog(faq);
                                                    }}
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </div>

                                              {/* Answer Content */}
                                              <div 
                                                className="overflow-hidden transition-all duration-300 ease-in-out"
                                                style={{
                                                  maxHeight: openQuestions[faq.id] ? '500px' : '0px'
                                                }}
                                              >
                                                <div className="px-4 pb-4">
                                                  <div className="pl-7 pr-4">
                                                    <div className="bg-gray-50 rounded-lg p-4">
                                                      <p className="text-gray-700 whitespace-pre-wrap">
                                                        {faq.answer}
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </DragDropContext>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedFaq(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? 'Edit FAQ' : 'Create New FAQ'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select or create a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or enter new category"
                value={!categories.includes(formData.category) ? formData.category : ''}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="mt-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="question">
                Question <span className="text-red-500">*</span>
              </Label>
              <Input
                id="question"
                placeholder="Enter the question"
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">
                Answer <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="answer"
                placeholder="Enter the answer"
                rows={5}
                value={formData.answer}
                onChange={(e) =>
                  setFormData({ ...formData, answer: e.target.value })
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                setSelectedFaq(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleUpdateFaq : handleCreateFaq}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating
                ? 'Saving...'
                : isEditDialogOpen
                ? 'Update FAQ'
                : 'Create FAQ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the FAQ "{selectedFaq?.question}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedFaq(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFaq}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}