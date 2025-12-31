import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { extractResopnseIdentifier } from "@/lib/utils";
import type { FormResponse } from "@/services/supabase.service";
import { AlertTriangle, Trash2 } from "lucide-react";

function DeleteResponseConfirmation({
  response,
  open,
  onOpenChange,
  onConfirm,
  onCancel
}: {
  response: FormResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void | null;
}) {
  if (!response) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-red-100 p-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle>
              Delete {extractResopnseIdentifier(response) || "Response"}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            This action cannot be undone. The response will be permanently
            deleted from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          >
            {/* <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </> */}
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteResponseConfirmation;
