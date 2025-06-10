"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dispatch, SetStateAction, useState } from "react";
import sendSMSMessage from "@/firebase/messages";
import { Message, Account } from "@/types";

interface SendMessageFormProps {
  message: Message;
  users: Account[];
  state: [boolean, Dispatch<SetStateAction<boolean>>];
}

export function SendMessageForm({ message, users, state }: SendMessageFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const schema = z.object({
    id: z.string().min(1, { message: "עליך לבחור משתמש כדי לשלוח לו הודעה!" }),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: "",
    },
  });

  async function handleSubmit(values: z.infer<typeof schema>) {
    setIsLoading(true);
    const { id } = values;
    const user = users.find((user) => user.id === id);
    const { id: _, label, ...otherMessageData } = message;
    const finalMessage: Message = {
      ...otherMessageData,
      token: user?.fcmToken!,
    };

    try {
      await sendSMSMessage(finalMessage);
      toast({
        title: "הצלחה!",
        description: "ההודעה נשלחה בהצלחה",
        variant: "default",
      });
    } catch (err: any) {
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
  }

  return (
    <Dialog open={state[0]} onOpenChange={(open) => state[1](open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-extrabold text-2xl">
            שליחת הודעה ידנית
          </DialogTitle>
        </DialogHeader>
        <p>סוג ההודעה: {message.label}</p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              name="id"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-bold">
                    בחר את שם המשתמש שאליו תרצה לשלוח הודעה
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר משתמש" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user, index) => {
                          return (
                            <SelectItem key={index} value={user.id}>
                              {user.displayName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <Button className="w-full my-4" disabled={isLoading}>
              {isLoading ? "שולח..." : "שלח הודעה למשתמש"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}