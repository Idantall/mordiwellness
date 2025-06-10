"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Dispatch, SetStateAction, useState } from "react";
import createInitialMessage from "@/firebase/messages";
import { Message } from "@/types";
import { Input } from "@/components/ui/input";

interface CreateSmsMessageFormProps {
  state: [boolean, Dispatch<SetStateAction<boolean>>];
  accessToken: string;
  addMessage: (message: MessageWithHours) => void;
}

interface MessageWithHours extends Message {
  atHour: string;
}

export function CreateSmsMessageForm({
  state,
  addMessage,
}: CreateSmsMessageFormProps) {
  const form = useForm<MessageWithHours>({
    defaultValues: {
      label: "",
      notification: {
        title: "",
        body: "",
      },
      data: {
        type: "",
      },
      atHour: "",
    },
  });

  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (data: MessageWithHours) => {
    console.log(data);
    try {
      await createInitialMessage(data);
      addMessage(data);
      toast({
        title: "הצלחה!",
        description: "יצרת הודעה חדשה בהצלחה!",
        variant: "default",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "שגיאה!",
        description: "נראה שמשהו לא עבד בעת שליחת ההודעה",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
            יצירת הודעה חדשה
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          הודעה יכולה להישלח ידנית ולפי זמן מוגדר
        </DialogDescription>
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
                    <Select onValueChange={field.onChange}>
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
            <Button type="submit" disabled={isLoading} className="w-full my-4">
              {isLoading ? "יוצר הודעה..." : "צור הודעה חדשה"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
