// src/components/footer/FooterSettingsManager.tsx
"use client";

import React, { useState } from "react";
import {
  useGetFooterSettingsQuery,
  useCreateFooterSettingsMutation,
  useUpdateFooterSettingsMutation,
  useDeleteFooterSettingsMutation,
  useAddFooterColumnMutation,
  useUpdateFooterColumnMutation,
  useDeleteFooterColumnMutation,
  useAddFooterElementMutation,
  useUpdateFooterElementMutation,
  useDeleteFooterElementMutation,
  FooterSettings,
  FooterColumn,
  FooterElement,
} from "@/features/footerSettingsApi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Edit,
  Save,
  X,
  Settings,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Plus,
  AlertCircle,
  Link as LinkIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface CompanyFormState {
  companyName: string;
  address: string;
  email: string;
  phone1: string;
  phone2: string;
  dbidNumber: string;
  tradeLicense: string;
  newsletterTitle: string;
  newsletterDescription: string;
  socialMediaTitle: string;
  twitterUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  whatsappUrl: string;
  copyrightText: string;
  paymentBannerImage: string;
}

interface ColumnFormState {
  title: string;
  isVisible: boolean;
}

interface ElementFormState {
  label: string;
  url: string;
  displayOrder: number;
  isVisible: boolean;
  openInNewTab: boolean;
}

export default function FooterSettingsManager() {
  const { data, isLoading, error, refetch } = useGetFooterSettingsQuery();
  const [createFooterSettings, { isLoading: isCreating }] =
    useCreateFooterSettingsMutation();
  const [updateFooterSettings, { isLoading: isUpdating }] =
    useUpdateFooterSettingsMutation();
  const [deleteFooterSettings, { isLoading: isDeleting }] =
    useDeleteFooterSettingsMutation();

  // Column mutations
  const [addColumn] = useAddFooterColumnMutation();
  const [updateColumn] = useUpdateFooterColumnMutation();
  const [deleteColumn] = useDeleteFooterColumnMutation();

  // Element mutations
  const [addElement] = useAddFooterElementMutation();
  const [updateElement] = useUpdateFooterElementMutation();
  const [deleteElement] = useDeleteFooterElementMutation();

  const [activeTab, setActiveTab] = useState("view");
  const [isEditing, setIsEditing] = useState(false);

  // Dialog states
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [isElementDialogOpen, setIsElementDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<FooterColumn | null>(null);
  const [editingElement, setEditingElement] = useState<FooterElement | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>("");

  const footerSettings = data?.data;

  // Company info form state
  const [companyForm, setCompanyForm] = useState<CompanyFormState>({
    companyName: "",
    address: "",
    email: "",
    phone1: "",
    phone2: "",
    dbidNumber: "",
    tradeLicense: "",
    newsletterTitle: "Let's keep in touch",
    newsletterDescription: "Get recommendations, tips, updates and more.",
    socialMediaTitle: "Stay Connected",
    twitterUrl: "",
    facebookUrl: "",
    youtubeUrl: "",
    instagramUrl: "",
    whatsappUrl: "",
    copyrightText: "Copyright © 2026 FinixMart, All rights reserved.",
    paymentBannerImage: "/footer/sslcommerz-banner.png",
  });

  // Column form state (simplified - no slug, no displayOrder)
  const [columnForm, setColumnForm] = useState<ColumnFormState>({
    title: "",
    isVisible: true,
  });

  // Element form state
  const [elementForm, setElementForm] = useState<ElementFormState>({
    label: "",
    url: "",
    displayOrder: 0,
    isVisible: true,
    openInNewTab: false,
  });

  // Load existing settings into form when editing
  const handleEdit = () => {
    if (footerSettings) {
      setCompanyForm({
        companyName: footerSettings.companyName,
        address: footerSettings.address,
        email: footerSettings.email,
        phone1: footerSettings.phone1,
        phone2: footerSettings.phone2 || "",
        dbidNumber: footerSettings.dbidNumber,
        tradeLicense: footerSettings.tradeLicense,
        newsletterTitle: footerSettings.newsletterTitle,
        newsletterDescription: footerSettings.newsletterDescription,
        socialMediaTitle: footerSettings.socialMediaTitle,
        twitterUrl: footerSettings.twitterUrl || "",
        facebookUrl: footerSettings.facebookUrl || "",
        youtubeUrl: footerSettings.youtubeUrl || "",
        instagramUrl: footerSettings.instagramUrl || "",
        whatsappUrl: footerSettings.whatsappUrl || "",
        copyrightText: footerSettings.copyrightText,
        paymentBannerImage: footerSettings.paymentBannerImage,
      });
      setIsEditing(true);
      setActiveTab("edit");
    }
  };

  const handleSaveCompanyInfo = async () => {
    try {
      if (isEditing && footerSettings) {
        await updateFooterSettings({
          companyName: companyForm.companyName,
          address: companyForm.address,
          email: companyForm.email,
          phone1: companyForm.phone1,
          phone2: companyForm.phone2 || null,
          dbidNumber: companyForm.dbidNumber,
          tradeLicense: companyForm.tradeLicense,
          newsletterTitle: companyForm.newsletterTitle,
          newsletterDescription: companyForm.newsletterDescription,
          socialMediaTitle: companyForm.socialMediaTitle,
          twitterUrl: companyForm.twitterUrl || null,
          facebookUrl: companyForm.facebookUrl || null,
          youtubeUrl: companyForm.youtubeUrl || null,
          instagramUrl: companyForm.instagramUrl || null,
          whatsappUrl: companyForm.whatsappUrl || null,
          copyrightText: companyForm.copyrightText,
          paymentBannerImage: companyForm.paymentBannerImage,
        }).unwrap();
        alert("Footer settings updated successfully!");
      } else {
        await createFooterSettings({
          companyName: companyForm.companyName,
          address: companyForm.address,
          email: companyForm.email,
          phone1: companyForm.phone1,
          phone2: companyForm.phone2 || null,
          dbidNumber: companyForm.dbidNumber,
          tradeLicense: companyForm.tradeLicense,
          newsletterTitle: companyForm.newsletterTitle,
          newsletterDescription: companyForm.newsletterDescription,
          socialMediaTitle: companyForm.socialMediaTitle,
          twitterUrl: companyForm.twitterUrl || null,
          facebookUrl: companyForm.facebookUrl || null,
          youtubeUrl: companyForm.youtubeUrl || null,
          instagramUrl: companyForm.instagramUrl || null,
          whatsappUrl: companyForm.whatsappUrl || null,
          copyrightText: companyForm.copyrightText,
          paymentBannerImage: companyForm.paymentBannerImage,
        }).unwrap();
        alert("Footer settings created successfully!");
      }
      refetch();
      setActiveTab("view");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Failed to save footer settings:", error);
      alert(error?.data?.message || "Failed to save footer settings");
    }
  };

  const handleDelete = async () => {
    if (
      confirm(
        "Are you sure you want to delete the footer settings? This will also delete all columns and elements."
      )
    ) {
      try {
        await deleteFooterSettings().unwrap();
        alert("Footer settings deleted successfully!");
        refetch();
        setActiveTab("view");
      } catch (error: any) {
        console.error("Failed to delete footer settings:", error);
        alert(error?.data?.message || "Failed to delete footer settings");
      }
    }
  };

  const handleCancel = () => {
    setActiveTab("view");
    setIsEditing(false);
  };

  const handleCompanyInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCompanyForm({ ...companyForm, [name]: value });
  };

  // Column handlers
  const handleOpenColumnDialog = (column?: FooterColumn) => {
    if (column) {
      setEditingColumn(column);
      setColumnForm({
        title: column.title,
        isVisible: column.isVisible,
      });
    } else {
      setEditingColumn(null);
      setColumnForm({
        title: "",
        isVisible: true,
      });
    }
    setIsColumnDialogOpen(true);
  };

  const handleSaveColumn = async () => {
    try {
      if (editingColumn) {
        await updateColumn({
          columnId: editingColumn.id,
          data: columnForm,
        }).unwrap();
        alert("Column updated successfully!");
      } else {
        if (!footerSettings?.id) {
          alert("Please create footer settings first!");
          return;
        }
        await addColumn({
          footerSettingsId: footerSettings.id,
          data: columnForm,
        }).unwrap();
        alert("Column added successfully!");
      }
      setIsColumnDialogOpen(false);
      refetch();
    } catch (error: any) {
      console.error("Failed to save column:", error);
      alert(error?.data?.message || "Failed to save column");
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (confirm("Are you sure? This will delete all elements in this column.")) {
      try {
        await deleteColumn(columnId).unwrap();
        alert("Column deleted successfully!");
        refetch();
      } catch (error: any) {
        console.error("Failed to delete column:", error);
        alert(error?.data?.message || "Failed to delete column");
      }
    }
  };

  const handleToggleColumnVisibility = async (column: FooterColumn) => {
    try {
      await updateColumn({
        columnId: column.id,
        data: { isVisible: !column.isVisible },
      }).unwrap();
      refetch();
    } catch (error: any) {
      console.error("Failed to toggle column visibility:", error);
    }
  };

  // Element handlers
  const handleOpenElementDialog = (columnId: string, element?: FooterElement) => {
    setSelectedColumnId(columnId);
    if (element) {
      setEditingElement(element);
      setElementForm({
        label: element.label,
        url: element.url,
        displayOrder: element.displayOrder,
        isVisible: element.isVisible,
        openInNewTab: element.openInNewTab,
      });
    } else {
      setEditingElement(null);
      const column = footerSettings?.columns.find((c) => c.id === columnId);
      setElementForm({
        label: "",
        url: "",
        displayOrder: column?.elements.length || 0,
        isVisible: true,
        openInNewTab: false,
      });
    }
    setIsElementDialogOpen(true);
  };

  const handleSaveElement = async () => {
    try {
      if (editingElement) {
        await updateElement({
          elementId: editingElement.id,
          data: elementForm,
        }).unwrap();
        alert("Element updated successfully!");
      } else {
        await addElement({
          columnId: selectedColumnId,
          data: elementForm,
        }).unwrap();
        alert("Element added successfully!");
      }
      setIsElementDialogOpen(false);
      refetch();
    } catch (error: any) {
      console.error("Failed to save element:", error);
      alert(error?.data?.message || "Failed to save element");
    }
  };

  const handleDeleteElement = async (elementId: string) => {
    if (confirm("Are you sure you want to delete this element?")) {
      try {
        await deleteElement(elementId).unwrap();
        alert("Element deleted successfully!");
        refetch();
      } catch (error: any) {
        console.error("Failed to delete element:", error);
        alert(error?.data?.message || "Failed to delete element");
      }
    }
  };

  const handleToggleElementVisibility = async (element: FooterElement) => {
    try {
      await updateElement({
        elementId: element.id,
        data: { isVisible: !element.isVisible },
      }).unwrap();
      refetch();
    } catch (error: any) {
      console.error("Failed to toggle element visibility:", error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" /> Footer Settings Manager
          </h1>
          <p className="text-muted-foreground">
            Manage your website footer information, columns, and links
          </p>
        </div>
        {!footerSettings && !isLoading && (
          <Button
            onClick={() => setActiveTab("create")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Footer Settings
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="view">View Settings</TabsTrigger>
          <TabsTrigger value="create" disabled={!!footerSettings}>
            Create New
          </TabsTrigger>
          <TabsTrigger value="edit" disabled={!footerSettings}>
            Edit Info
          </TabsTrigger>
          <TabsTrigger value="columns" disabled={!footerSettings}>
            Manage Columns
          </TabsTrigger>
        </TabsList>

        {/* -------- View Tab -------- */}
        <TabsContent value="view" className="space-y-4 mt-6">
          {isLoading ? (
            <Card>
              <CardContent className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-10">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error loading footer settings. Please try again.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : footerSettings ? (
            <div className="space-y-4">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Company Name</Label>
                      <p className="font-medium">{footerSettings.companyName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" /> {footerSettings.email}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Primary Phone</Label>
                      <p className="font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {footerSettings.phone1}
                      </p>
                    </div>
                    {footerSettings.phone2 && (
                      <div>
                        <Label className="text-muted-foreground">Secondary Phone</Label>
                        <p className="font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4" /> {footerSettings.phone2}
                        </p>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <Label className="text-muted-foreground">Address</Label>
                      <p className="font-medium flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-1" /> {footerSettings.address}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">DBID Number</Label>
                      <p className="font-medium">{footerSettings.dbidNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Trade License</Label>
                      <p className="font-medium">{footerSettings.tradeLicense}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic Columns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Footer Columns ({footerSettings.columns.length})</span>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab("columns")}
                      variant="outline"
                    >
                      Manage Columns
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {footerSettings.columns.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No columns added yet. Go to "Manage Columns" tab to add columns.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {footerSettings.columns.map((column) => (
                        <div key={column.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{column.title}</h3>
                            {!column.isVisible && (
                              <Badge variant="secondary">Hidden</Badge>
                            )}
                          </div>
                          <ul className="space-y-1 text-sm">
                            {[...column.elements]
                              .sort((a, b) => a.displayOrder - b.displayOrder)
                              .map((element) => (
                                <li
                                  key={element.id}
                                  className="flex items-center gap-1"
                                >
                                  <LinkIcon className="w-3 h-3" />
                                  <span className={!element.isVisible ? "opacity-50" : ""}>
                                    {element.label}
                                  </span>
                                  {element.openInNewTab && (
                                    <Badge variant="outline" className="text-xs">
                                      ↗
                                    </Badge>
                                  )}
                                </li>
                              ))}
                            {column.elements.length === 0 && (
                              <li className="text-muted-foreground italic">
                                No elements
                              </li>
                            )}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Newsletter & Social */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Newsletter</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-muted-foreground">Title</Label>
                      <p className="font-medium">{footerSettings.newsletterTitle}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Description</Label>
                      <p className="text-sm">{footerSettings.newsletterDescription}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" /> Social Media
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-muted-foreground">Title</Label>
                      <p className="font-medium">{footerSettings.socialMediaTitle}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {footerSettings.twitterUrl && (
                        <div>
                          <Badge variant="outline">Twitter</Badge>
                        </div>
                      )}
                      {footerSettings.facebookUrl && (
                        <div>
                          <Badge variant="outline">Facebook</Badge>
                        </div>
                      )}
                      {footerSettings.youtubeUrl && (
                        <div>
                          <Badge variant="outline">YouTube</Badge>
                        </div>
                      )}
                      {footerSettings.instagramUrl && (
                        <div>
                          <Badge variant="outline">Instagram</Badge>
                        </div>
                      )}
                      {footerSettings.whatsappUrl && (
                        <div>
                          <Badge variant="outline">WhatsApp</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom Bar */}
              <Card>
                <CardHeader>
                  <CardTitle>Bottom Bar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Copyright Text</Label>
                    <p className="font-medium">{footerSettings.copyrightText}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Payment Banner Image</Label>
                    <p className="text-sm">{footerSettings.paymentBannerImage}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between bg-muted/50">
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(footerSettings.updatedAt).toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEdit}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />{" "}
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <Card className="text-center py-10">
              <CardContent>
                <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Footer Settings Found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your footer settings configuration.
                </p>
                <Button onClick={() => setActiveTab("create")}>
                  Create Footer Settings
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* -------- Create/Edit Tab -------- */}
        <TabsContent
          value={isEditing ? "edit" : "create"}
          className="space-y-4 mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? "Edit" : "Create"} Footer Settings</CardTitle>
              <CardDescription>
                {isEditing
                  ? "Update your footer company information"
                  : "Fill in the company details to create footer settings"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={companyForm.companyName}
                      onChange={handleCompanyInputChange}
                      placeholder="e.g., Finix Mart"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={companyForm.email}
                      onChange={handleCompanyInputChange}
                      placeholder="e.g., support@finixmart.com.bd"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone1">Primary Phone *</Label>
                    <Input
                      id="phone1"
                      name="phone1"
                      value={companyForm.phone1}
                      onChange={handleCompanyInputChange}
                      placeholder="e.g., +880 9647-415199"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone2">Secondary Phone</Label>
                    <Input
                      id="phone2"
                      name="phone2"
                      value={companyForm.phone2}
                      onChange={handleCompanyInputChange}
                      placeholder="e.g., +880 1911-802804"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={companyForm.address}
                      onChange={handleCompanyInputChange}
                      placeholder="e.g., HM Hasem Mansion (6th Floor), Purana Paltan, Paltan, Dhaka-1000."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dbidNumber">DBID Number *</Label>
                    <Input
                      id="dbidNumber"
                      name="dbidNumber"
                      value={companyForm.dbidNumber}
                      onChange={handleCompanyInputChange}
                      placeholder="e.g., 567849"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tradeLicense">Trade License *</Label>
                    <Input
                      id="tradeLicense"
                      name="tradeLicense"
                      value={companyForm.tradeLicense}
                      onChange={handleCompanyInputChange}
                      placeholder="e.g., E457/684"
                    />
                  </div>
                </div>
              </div>

              {/* Newsletter Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Newsletter</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newsletterTitle">Newsletter Title *</Label>
                    <Input
                      id="newsletterTitle"
                      name="newsletterTitle"
                      value={companyForm.newsletterTitle}
                      onChange={handleCompanyInputChange}
                      placeholder="e.g., Let's keep in touch"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newsletterDescription">
                      Newsletter Description *
                    </Label>
                    <Input
                      id="newsletterDescription"
                      name="newsletterDescription"
                      value={companyForm.newsletterDescription}
                      onChange={handleCompanyInputChange}
                      placeholder="e.g., Get recommendations, tips, updates and more."
                    />
                  </div>
                </div>
              </div>

              {/* Social Media Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Social Media</h3>
                <div className="space-y-2">
                  <Label htmlFor="socialMediaTitle">Social Media Title *</Label>
                  <Input
                    id="socialMediaTitle"
                    name="socialMediaTitle"
                    value={companyForm.socialMediaTitle}
                    onChange={handleCompanyInputChange}
                    placeholder="e.g., Stay Connected"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitterUrl">Twitter URL</Label>
                    <Input
                      id="twitterUrl"
                      name="twitterUrl"
                      value={companyForm.twitterUrl}
                      onChange={handleCompanyInputChange}
                      placeholder="https://twitter.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebookUrl">Facebook URL</Label>
                    <Input
                      id="facebookUrl"
                      name="facebookUrl"
                      value={companyForm.facebookUrl}
                      onChange={handleCompanyInputChange}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtubeUrl">YouTube URL</Label>
                    <Input
                      id="youtubeUrl"
                      name="youtubeUrl"
                      value={companyForm.youtubeUrl}
                      onChange={handleCompanyInputChange}
                      placeholder="https://youtube.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagramUrl">Instagram URL</Label>
                    <Input
                      id="instagramUrl"
                      name="instagramUrl"
                      value={companyForm.instagramUrl}
                      onChange={handleCompanyInputChange}
                      placeholder="https://instagram.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsappUrl">WhatsApp URL</Label>
                    <Input
                      id="whatsappUrl"
                      name="whatsappUrl"
                      value={companyForm.whatsappUrl}
                      onChange={handleCompanyInputChange}
                      placeholder="https://wa.me/yourphone"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Bar Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Bottom Bar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="copyrightText">Copyright Text *</Label>
                    <Input
                      id="copyrightText"
                      name="copyrightText"
                      value={companyForm.copyrightText}
                      onChange={handleCompanyInputChange}
                      placeholder="e.g., Copyright © 2026 FinixMart, All rights reserved."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentBannerImage">
                      Payment Banner Image *
                    </Label>
                    <Input
                      id="paymentBannerImage"
                      name="paymentBannerImage"
                      value={companyForm.paymentBannerImage}
                      onChange={handleCompanyInputChange}
                      placeholder="e.g., /footer/sslcommerz-banner.png"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button onClick={handleSaveCompanyInfo} disabled={isCreating || isUpdating}>
                <Save className="w-4 h-4 mr-2" />{" "}
                {isCreating || isUpdating
                  ? "Saving..."
                  : isEditing
                  ? "Update Settings"
                  : "Create Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* -------- Manage Columns Tab -------- */}
        <TabsContent value="columns" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Footer Columns</CardTitle>
                  <CardDescription>
                    Add, edit, and organize footer columns and their links
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenColumnDialog()}>
                  <Plus className="w-4 h-4 mr-2" /> Add Column
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!footerSettings?.columns.length ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground mb-4">
                    No columns added yet. Click "Add Column" to get started.
                  </p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {footerSettings.columns.map((column) => (
                    <AccordionItem key={column.id} value={column.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{column.title}</span>
                            {!column.isVisible && (
                              <Badge variant="secondary">Hidden</Badge>
                            )}
                            <Badge variant="secondary">
                              {column.elements.length} elements
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <div className="flex gap-2 mb-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenColumnDialog(column)}
                            >
                              <Edit className="w-3 h-3 mr-1" /> Edit Column
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleColumnVisibility(column)}
                            >
                              {column.isVisible ? (
                                <>
                                  <EyeOff className="w-3 h-3 mr-1" /> Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3 mr-1" /> Show
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenElementDialog(column.id)}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Element
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteColumn(column.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Delete Column
                            </Button>
                          </div>

                          {/* Elements List */}
                          {column.elements.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                              No elements in this column yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {[...column.elements]
                                .sort((a, b) => a.displayOrder - b.displayOrder)
                                .map((element) => (
                                  <div
                                    key={element.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline">
                                        {element.displayOrder}
                                      </Badge>
                                      <div>
                                        <p className="font-medium">
                                          {element.label}
                                        </p>
                                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                                          {element.url}
                                        </p>
                                      </div>
                                      {!element.isVisible && (
                                        <Badge variant="secondary">Hidden</Badge>
                                      )}
                                      {element.openInNewTab && (
                                        <Badge variant="outline">New Tab</Badge>
                                      )}
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          handleToggleElementVisibility(element)
                                        }
                                      >
                                        {element.isVisible ? (
                                          <EyeOff className="w-3 h-3" />
                                        ) : (
                                          <Eye className="w-3 h-3" />
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          handleOpenElementDialog(
                                            column.id,
                                            element
                                          )
                                        }
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          handleDeleteElement(element.id)
                                        }
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Column Dialog */}
      <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingColumn ? "Edit Column" : "Add New Column"}
            </DialogTitle>
            <DialogDescription>
              {editingColumn
                ? "Update the column title"
                : "Create a new footer column (just add a title)"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="column-title">Column Title *</Label>
              <Input
                id="column-title"
                value={columnForm.title}
                onChange={(e) =>
                  setColumnForm({ ...columnForm, title: e.target.value })
                }
                placeholder="e.g., Customer Service"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="column-visible"
                checked={columnForm.isVisible}
                onChange={(e) =>
                  setColumnForm({ ...columnForm, isVisible: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="column-visible">Visible</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsColumnDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveColumn}>
              {editingColumn ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Element Dialog */}
      <Dialog open={isElementDialogOpen} onOpenChange={setIsElementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingElement ? "Edit Element" : "Add New Element"}
            </DialogTitle>
            <DialogDescription>
              {editingElement
                ? "Update the link information"
                : "Create a new link element"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="element-label">Label *</Label>
              <Input
                id="element-label"
                value={elementForm.label}
                onChange={(e) =>
                  setElementForm({ ...elementForm, label: e.target.value })
                }
                placeholder="e.g., About Us"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="element-url">URL *</Label>
              <Input
                id="element-url"
                value={elementForm.url}
                onChange={(e) =>
                  setElementForm({ ...elementForm, url: e.target.value })
                }
                placeholder="e.g., /about"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="element-order">Display Order</Label>
              <Input
                id="element-order"
                type="number"
                value={elementForm.displayOrder}
                onChange={(e) =>
                  setElementForm({
                    ...elementForm,
                    displayOrder: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="element-visible"
                checked={elementForm.isVisible}
                onChange={(e) =>
                  setElementForm({ ...elementForm, isVisible: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="element-visible">Visible</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="element-new-tab"
                checked={elementForm.openInNewTab}
                onChange={(e) =>
                  setElementForm({
                    ...elementForm,
                    openInNewTab: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="element-new-tab">Open in New Tab</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsElementDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveElement}>
              {editingElement ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}