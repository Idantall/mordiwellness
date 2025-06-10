"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import validator from "validator";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const deleteAccountApplicationSchema = z.object({
  phone: z.string().refine(validator.isMobilePhone, "מספר טלפון לא תקינה"),
  name: z.string().min(1, "שם תצוגה הוא שדה חובה"),
});

type FormValues = z.infer<typeof deleteAccountApplicationSchema>;

const DeleteMyAccountPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(deleteAccountApplicationSchema),
    defaultValues: {
      name: "",
    },
  });

  const handleLogin = async (values: FormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await fetch("/api/delete-user-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: values.name,
          phoneNumber: values.phone,
          processed: false,
        }),
      });

      setSuccess(true);
    } catch (err: any) {
      console.log(err);
      setErrorMessage("מספר טלפון לא תקינה , אנא נסה שנית");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="w-full flex justify-center items-center h-screen">
      <div className="sm:w-[200px] md:w-[400px]">
        <Card>
          <CardHeader>
            <CardTitle className="font-bold">מחיקת חשבון</CardTitle>
          </CardHeader>
          <CardContent>
            {isSuccess ? <CardTitle>הבקשה נשלחה בהצלחה</CardTitle> : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleLogin)}>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>מספר טלפון</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            {...form.register("phone")}
                            required
                          />
                        </FormControl>
                        {form.formState.errors.phone && (
                          <FormMessage>
                            {form.formState.errors.phone.message}
                          </FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={(_) => (
                      <FormItem>
                        <FormLabel>שם</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            {...form.register("name")}
                            required
                          />
                        </FormControl>
                        {form.formState.errors.name && (
                          <FormMessage>
                            {form.formState.errors.name.message}
                          </FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                  {errorMessage && (
                    <p className="text-red-500 mt-2">{errorMessage}</p>
                  )}
                  <Button type="submit" className="mt-4" disabled={isLoading}>
                    {isLoading ? "טוען..." : "שליחה"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeleteMyAccountPage;
