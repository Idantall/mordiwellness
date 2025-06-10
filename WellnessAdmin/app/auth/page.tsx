"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { auth } from "@/firebase/client";
import { signInWithEmailAndPassword } from "firebase/auth";
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
import { useRouter } from "next/navigation";
import { API_URL } from "@/firebase";

const loginSchema = z.object({
    email: z.string().email("כתובת מייל לא תקינה"),
    password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const router = useRouter();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
        },
    });

    const handleLogin = async (values: LoginFormValues) => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const credential = await signInWithEmailAndPassword(
                auth,
                values.email,
                values.password
            );

            const idToken = await credential.user.getIdToken();

            await fetch(`${API_URL}/api/login`, {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });

            router.refresh();
        } catch (err: any) {
            console.log(err);
            setErrorMessage("מייל או סיסמא לא תקינים, אנא נסה שנית");
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="w-full flex justify-center items-center h-screen">
            <div className="sm:w-[200px] md:w-[400px]">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-bold">
                            כניסה למערכת ניהול
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleLogin)}>
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>מייל</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    {...form.register("email")}
                                                    required
                                                />
                                            </FormControl>
                                            {form.formState.errors.email && (
                                                <FormMessage>
                                                    {
                                                        form.formState.errors.email
                                                            .message
                                                    }
                                                </FormMessage>
                                            )}
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={(_) => (
                                        <FormItem>
                                            <FormLabel>סיסמת מנהל</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    {...form.register("password")}
                                                    required
                                                />
                                            </FormControl>
                                            {form.formState.errors.password && (
                                                <FormMessage>
                                                    {
                                                        form.formState.errors
                                                            .password.message
                                                    }
                                                </FormMessage>
                                            )}
                                        </FormItem>
                                    )}
                                />
                                {errorMessage && (
                                    <p className="text-red-500 mt-2">
                                        {errorMessage}
                                    </p>
                                )}
                                <Button
                                    type="submit"
                                    className="mt-4"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "טוען..." : "כניסה"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;
