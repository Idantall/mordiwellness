"use client";

import { MoodEmoji } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  updateDocument,
  createDocument,
  deleteDocument,
} from "@/app/utils/firestore";
import Image from "next/image";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface MoodsClientProps {
  moods: MoodEmoji[];
  accessToken: string;
}

const moodEntrySchema = z.object({
  image: z.union([z.instanceof(File), z.string()]).optional(),
  moodIndication: z
    .number()
    .min(0, { message: "האינדיקציה חייבת להיות גדולה מ0" })
    .max(100, { message: "האינדיקציה חייבת להיות קטנה מ100" }),
});

type MoodEntryValues = z.infer<typeof moodEntrySchema>;

export default function MoodsClient({ moods, accessToken }: MoodsClientProps) {
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodEmoji | null>(null);
  
  const router = useRouter();
  
  const formMethods = useForm<MoodEntryValues>({
    resolver: zodResolver(moodEntrySchema),
  });

  const updateForm = useForm<MoodEntryValues>({
    resolver: zodResolver(moodEntrySchema),
    defaultValues: {
        moodIndication: selectedMood?.moodIndication || 0,
        image: selectedMood?.image || "",
    }
  });

  const { toast } = useToast();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, setImagePreview: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    formMethods.setValue("image", file);
  };

  const handleCreateMood = async (data: MoodEntryValues) => {
    setIsLoading(true);
    try {
      // Upload image to Firebase Storage
      const formData = new FormData();

      let imageUrl = null;

      if (data.image) {
        console.log(data.image);
        formData.append("file", data.image);
        formData.append("path", `emojis/${(data.image as File).name}`);

        const uploadResponse = await axios.post(`/api/storage`, formData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        });

        imageUrl = uploadResponse.data.url;
      }

      await createDocument(
        "initial-emojis",
        {
          image: imageUrl ? imageUrl : "",
          moodIndication: data.moodIndication,
        },
        accessToken
      );
      router.refresh();
      toast({
        title: "הצלחה",
        description: "המצב רוח נוצר בהצלחה",
      });
      formMethods.reset();
      setCreateImagePreview(null);
    } catch (error) {
      console.error("Error creating mood:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף מצב רוח",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMood = async (data: MoodEntryValues) => {
    if (!selectedMood) return;
    setIsEditing(true);
    try {
      // Upload image to Firebase Storage if a new image is provided
      const formData = new FormData();

      let imageUrl = selectedMood.image;

      if (data.image && data.image instanceof File) {
        console.log(data.image);
        formData.append("file", data.image);
        formData.append("path", `emojis/${data.image.name}`);

        const uploadResponse = await axios.post(`/api/storage`, formData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        });

        imageUrl = uploadResponse.data.url;
      }

      await updateDocument(
        "initial-emojis",
        selectedMood.id!,
        {
          image: imageUrl ? imageUrl : "",
          moodIndication: data.moodIndication,
        },
        accessToken
      );
      router.refresh();
      toast({
        title: "הצלחה",
        description: "המצב רוח עודכן בהצלחה",
      });
      formMethods.reset();
      setEditImagePreview(null);
      setSelectedMood(null);
    } catch (error) {
      console.error("Error updating mood:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן מצב רוח",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteMood = async (moodId: string) => {
    setIsDeleting(true);
    try {
      await deleteDocument("initial-emojis", moodId, accessToken);
      router.refresh();
      toast({
        title: "הצלחה",
        description: "המצב רוח נמחק בהצלחה",
      });
    } catch (error) {
      console.error("Error deleting mood:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק מצב רוח",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (selectedMood) {
      updateForm.reset({
        moodIndication: selectedMood.moodIndication,
        image: selectedMood.image,
      });
      setEditImagePreview(selectedMood.image);
    }
  }, [selectedMood]);

  return (
    <div className="container mx-auto p-4 rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">מצבים רוח</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>הוסף מצב רוח</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוסף מצב רוח חדש</DialogTitle>
              <DialogDescription>
                מלא את הפרטים הבאים כדי להוסיף מצב רוח חדש.
              </DialogDescription>
            </DialogHeader>
            <Form {...formMethods}>
              <form
                onSubmit={formMethods.handleSubmit(handleCreateMood as any)}
                className="space-y-4"
              >
                <FormField
                  name="moodIndication"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>אינדיקציית מצב רוח</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...formMethods.register(field.name, {
                            required: true,
                            valueAsNumber: true,
                          })}
                          className="input"
                          placeholder="הכנס אינדיקציה"
                        />
                      </FormControl>
                      <FormDescription>
                        ערך בין 0 ל-60, כאשר 0 הוא שלילי ו-60 חיובי.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>תמונה</FormLabel>
                      <FormControl>
                        <div>
                          <Label
                            htmlFor="image-create"
                            className={buttonVariants({ variant: "outline" })}
                          >
                            בחר תמונה
                          </Label>
                          <input
                            type="file"
                            {...formMethods.register(field.name, {
                              required: true,               
                            })}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              field.onChange(e);
                              handleImageChange(e, setCreateImagePreview);
                            }}
                            id="image-create"
                          />
                        </div>
                      </FormControl>

                      {createImagePreview && (
                        <div className="mt-2">
                          <img
                            src={createImagePreview}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-md"
                          />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "שומר..." : "שמור"}
                  </Button>
                  <DialogClose asChild>
                    <Button variant="ghost">ביטול</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="my-4 flex flex-col gap-2">
        <span>המצבים מסודרים לפי סדר אינדיקציית מצבי הרוח</span>
        <span>ככל שהאינדיקציה יותר קרובה ל100, ככה המצב רוח יותר שלילי!</span>
        <span>ולהפך, ככל שהאינדיקציה יותר קרובה ל0, ככה הוא יותר חיובי!</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">אינדיקציית מצב רוח</TableHead>
            <TableHead className="text-right">תמונה</TableHead>
            <TableHead className="text-right">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {moods
            .toSorted((a, b) => a.moodIndication - b.moodIndication)
            .map((mood, index) => (
              <TableRow key={index}>
                <TableCell>{mood.moodIndication}</TableCell>
                <TableCell>
                  <Image
                    src={mood.image}
                    alt={mood.moodIndication.toString()}
                    width={32}
                    height={32}
                  />
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button onClick={() => handleDeleteMood(mood.id!)} disabled={isDeleting}>
                    {isDeleting ? "מוחק..." : "מחק"}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedMood(mood)}>ערוך</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>ערוך מצב רוח</DialogTitle>
                        <DialogDescription>
                          ערוך את הפרטים הבאים כדי לעדכן מצב רוח.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...updateForm}>
                        <form
                          onSubmit={updateForm.handleSubmit(handleEditMood as any)}
                          className="space-y-4"
                        >
                          <FormField
                            name="moodIndication"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>אינדיקציית מצב רוח</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...updateForm.register(field.name, {
                                      required: true,
                                      valueAsNumber: true,
                                    })}
                                    className="input"
                                    placeholder="הכנס אינדיקציה"
                                    defaultValue={mood.moodIndication}
                                  />
                                </FormControl>
                                <FormDescription>
                                  ערך בין 0 ל-100, כאשר 100 הוא שלילי ו-0 חיובי.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            name="image"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>תמונה</FormLabel>
                                <FormControl>
                                  <div>
                                    <Label
                                      htmlFor="image-edit"
                                      className={buttonVariants({ variant: "outline" })}
                                    >
                                      בחר תמונה
                                    </Label>
                                    <input
                                      type="file"
                                      {...updateForm.register(field.name, {
                                        required: false,               
                                      })}
                                      className="hidden"
                                      accept="image/*"
                                      onChange={(e) => {
                                        field.onChange(e);
                                        handleImageChange(e, setEditImagePreview);
                                      }}
                                      id="image-edit"
                                    />
                                  </div>
                                </FormControl>

                                {editImagePreview && (
                                  <div className="mt-2">
                                    <img
                                      src={editImagePreview || field.value}
                                      alt="Preview"
                                      className="w-32 h-32 object-cover rounded-md"
                                    />
                                  </div>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="submit" disabled={isEditing}>
                              {isEditing ? "שומר..." : "שמור"}
                            </Button>
                            <DialogClose asChild>
                              <Button variant="ghost">ביטול</Button>
                            </DialogClose>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
