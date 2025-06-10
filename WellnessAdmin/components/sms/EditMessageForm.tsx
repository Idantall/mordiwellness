"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dispatch, SetStateAction, useState } from "react";
import {
  deleteInitialMessage,
  updateInitialMessage,
} from "@/firebase/messages";
import { Message } from "@/types";

interface EditMessageFormProps {
  message: MessageWithHours;
  state: [boolean, Dispatch<SetStateAction<boolean>>];
  editMessage: (message: MessageWithHours) => void;
  deleteMessage: (messageId: string) => void;
}


export interface MessageWithHours extends Message {
  atHour: string;
}

export function EditMessageForm({
  message,
  state,
  editMessage,
  deleteMessage,
}: EditMessageFormProps) {
  const form = useForm<MessageWithHours>({
    defaultValues: {
      label: message.label,
      data: message.data,
      notification: message.notification,
      atHour: message.atHour
    },
  });

  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleSubmit = async (data: MessageWithHours) => {
    setIsEditing(true);
    try {
      await updateInitialMessage(message.id!, data);
      editMessage(data);
      toast({
        title: "הצלחה!",
        description: "ההודעה נערכה בהצלחה!",
        variant: "default",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "שגיאה!",
        description: "נראה שמשהו לא עבד בעת עריכת ההודעה",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
      state[1](false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteInitialMessage(message.id!);
      deleteMessage(message.id!);
      toast({
        title: "הצלחה!",
        description: "ההודעה נמחקה בהצלחה!",
        variant: "default",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "שגיאה!",
        description: "נראה שמשהו לא עבד בעת מחיקת ההודעה",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      state[1](false);
    }
  };

  const roundHours = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });

  return (
    <Dialog open={state[0]} onOpenChange={(open) => state[1](open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-extrabold text-2xl">
            עריכת הודעה
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>ערוך את פרטי ההודעה או מחק אותה</DialogDescription>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              name="label"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סוג ההודעה</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="הודעה לשיפור מצב הרוח.." />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="notification.title"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>כותרת ההודעה</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="הכנס כותרת" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="notification.body"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>גוף ההודעה</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="הכנס גוף הודעה" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="atHour"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שעה לשליחה</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר שעה לשליחה" />
                      </SelectTrigger>
                      <SelectContent>
                        {roundHours.map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isEditing} className="w-full my-4">
              {isEditing ? "שומר..." : "שמור שינויים"}
            </Button>
          </form>
        </Form>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full" disabled={isDeleting}>
              {isDeleting ? "מוחק..." : "מחק הודעה"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
              <AlertDialogDescription>
                פעולה זו תמחק את ההודעה לצמיתות.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "מוחק..." : "מחק"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
