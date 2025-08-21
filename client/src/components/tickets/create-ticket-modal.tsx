import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CloudUploadIcon } from "lucide-react";

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateTicketModal({ open, onOpenChange }: CreateTicketModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
  });

  // Inject CSS to fix transparent dropdowns and other UI elements
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Force opaque backgrounds for all UI components */
      .select-content, .select-item, .select-trigger,
      [data-radix-popper-content-wrapper],
      .bg-red-50, .bg-blue-50, .bg-yellow-50, .bg-green-50,
      .dark .bg-red-900\\/20, .dark .bg-blue-900\\/20, .dark .bg-yellow-900\\/20, .dark .bg-green-900\\/20,
      .bg-white, .dark .bg-gray-800,
      .bg-gray-50, .dark .bg-gray-900,
      .bg-primary, .bg-secondary,
      .bg-destructive, .bg-muted,
      .bg-popover, .bg-card,
      .bg-accent, .bg-accent-foreground {
        background-color: var(--background) !important;
        background: var(--background) !important;
        opacity: 1 !important;
      }
      
      /* Force opaque borders */
      .border, .border-red-200, .border-blue-200, .border-yellow-200, .border-green-200,
      .dark .border-red-800, .dark .border-blue-800, .dark .border-yellow-800, .dark .border-green-800,
      .border-gray-300, .dark .border-gray-600 {
        border-color: var(--border) !important;
        opacity: 1 !important;
      }
      
      /* Force opaque text */
      .text-red-500, .text-blue-600, .text-yellow-600, .text-green-600,
      .dark .text-red-400, .dark .text-blue-400, .dark .text-yellow-400, .dark .text-green-400 {
        color: var(--foreground) !important;
        opacity: 1 !important;
      }
      
      /* Ensure modals and overlays are opaque */
      .fixed.inset-0.bg-black.bg-opacity-50,
      .bg-white, .dark .bg-gray-800,
      .bg-gray-50, .dark .bg-gray-900 {
        background-color: var(--background) !important;
        background: var(--background) !important;
        opacity: 1 !important;
      }
      
      /* Fix any remaining transparent elements */
      .bg-opacity-50, .bg-opacity-20, .bg-opacity-10 {
        opacity: 1 !important;
      }
      
      /* Ensure form elements have proper backgrounds */
      input, select, textarea, button {
        background-color: var(--background) !important;
        background: var(--background) !important;
        opacity: 1 !important;
      }
      
      /* Fix modal backgrounds */
      .modal, .dialog, .popover, .tooltip {
        background-color: var(--background) !important;
        background: var(--background) !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: typeof formData) => {
      const response = await apiRequest("POST", "/api/tickets", ticketData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ticket created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      onOpenChange(false);
      setFormData({ title: "", description: "", category: "", priority: "" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || !formData.priority) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createTicketMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <Input
              type="text"
              required
              placeholder="Brief description of the issue"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              data-testid="input-modal-ticket-title"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger data-testid="select-modal-ticket-category" className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                  <SelectItem value="hardware" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Hardware</SelectItem>
                  <SelectItem value="software" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Software</SelectItem>
                  <SelectItem value="network" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Network</SelectItem>
                  <SelectItem value="access" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Access</SelectItem>
                  <SelectItem value="other" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority *
              </label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger data-testid="select-modal-ticket-priority" className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 !text-gray-900 dark:!text-white shadow-sm">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="!bg-white dark:!bg-gray-800 !border-gray-300 dark:!border-gray-600 shadow-xl z-50">
                  <SelectItem value="low" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Low</SelectItem>
                  <SelectItem value="medium" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Medium</SelectItem>
                  <SelectItem value="high" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">High</SelectItem>
                  <SelectItem value="critical" className="!bg-white dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-700 !text-gray-900 dark:!text-white cursor-pointer">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <Textarea
              required
              rows={4}
              placeholder="Detailed description of the issue, steps to reproduce, error messages, etc."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="resize-none"
              data-testid="textarea-modal-ticket-description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attachments
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
              <CloudUploadIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Drop files here or <Button type="button" variant="link" className="p-0 h-auto font-medium text-primary">browse</Button>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Support for images, documents, and logs (max 10MB)
              </p>
              <input
                type="file"
                multiple
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf,.txt,.log"
                data-testid="input-modal-ticket-attachments"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              data-testid="button-modal-cancel-ticket"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTicketMutation.isPending}
              data-testid="button-modal-submit-ticket"
            >
              {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
