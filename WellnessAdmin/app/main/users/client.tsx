"use client";

import { useState } from "react";
import { DataTable } from "@/components/general/data-table";
import {
  Account,
  ColumnConfig,
  CategoryDocument,
  GoalDocument,
  MoodEmoji,
} from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FaSmile, FaFrown, FaAngry, FaMeh, FaQuestion } from "react-icons/fa";
import {
  createDocument,
  updateDocument,
  deleteDocument,
} from "@/app/utils/firestore";
import Image from "next/image";

interface UsersClientProps {
  initialUsers: Account[];
  token: string;
}

export default function UsersClient({ initialUsers, token }: UsersClientProps) {
  const [users, setUsers] = useState<Account[]>(initialUsers);
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<Account | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateUser = async (user: Account) => {
    try {
      const userToCreate = {
        ...user,
        age: Number(user.age),
        disabled: String(user.disabled) === "true",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const newUser = await createDocument("users", userToCreate, token);
      setUsers([...users, newUser]);
      toast({
        title: "משתמש נוצר בהצלחה",
        description: `משתמש חדש נוסף עם מזהה ${newUser.id}`,
      });
    } catch (e) {
      console.error("Error adding user: ", e);
      handleError(e);
    }
  };

  const handleEditUser = async (index: number, user: Account) => {
    try {
      const userToUpdate = {
        ...user,
        age: Number(user.age),
        disabled: String(user.disabled) === "true",
        updatedAt: new Date(),
      };
      await updateDocument("users", user.id, userToUpdate, token);
      const updatedUsers = [...users];
      updatedUsers[index] = user;
      setUsers(updatedUsers);
      toast({
        title: "משתמש עודכן בהצלחה",
        description: `המשתמש "${user.displayName}" עודכן`,
      });
    } catch (e) {
      console.error("Error updating user: ", e);
      handleError(e);
    }
  };

  const handleDeleteUser = async (user: Account) => {
    try {
      await deleteDocument("users", user.id, token);
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id));
      toast({
        title: "משתמש נמחק בהצלחה",
        description: `המשתמש "${user.displayName}" נמחק מהמערכת`,
      });
    } catch (e) {
      console.error("Error deleting user: ", e);
      handleError(e);
    }
  };

  const handleViewCategories = (user: Account) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleError = (error: any) => {
    if (error.response?.status === 401) {
      toast({
        title: "שגיאה בהרשאה",
        description: "אין לך הרשאה לבצע פעולה זו. אנא התחבר מחדש.",
        variant: "destructive",
      });
    } else if (error.response?.status === 500) {
      toast({
        title: "שגיאת שרת",
        description: "אירעה שגיאה בשרת. אנא נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה. אנא נסה שוב.",
        variant: "destructive",
      });
    }
  };

  const columnConfig: Partial<Record<keyof Account, ColumnConfig>> = {
    id: { label: "מזהה", inputType: "id" },
    displayName: { label: "שם משתמש", inputType: "text", required: true },
    phoneNumber: {
      label: "מספר טלפון",
      inputType: "text",
      required: false,
      isHiddenFromForm: true,
    },
    age: { label: "גיל", inputType: "number", required: true },
    city: { label: "עיר", inputType: "text", required: true },
    gender: {
      label: "מין",
      inputType: "select",
      options: [
        { value: "male", label: "זכר" },
        { value: "female", label: "נקבה" },
      ],
      required: true,
    },
    disabled: {
      label: "מושהה?",
      inputType: "boolean",
    },
    createdAt: {
      label: "נוצר בתאריך",
      inputType: "date",
    },
    updatedAt: {
      label: "עודכן בתאריך",
      inputType: "date",
    },
    categories: {
      label: "קטגוריות",
      inputType: "custom",
      required: false,
      isHiddenFromForm: true,
      customComponent: (row: Account) => (
        <Button onClick={() => handleViewCategories(row)}>צפה בקטגוריות</Button>
      ),
    },
    currentMood: {
      label: "מצב רוח נוכחי",
      inputType: "custom",
      required: false,
      isHiddenFromForm: true,
      customComponent: (row: Account) => (
        <div className="w-full flex justify-center items-center">
          {row.currentMood && row.currentMood.image.startsWith("https://") ? (
            <Image
              src={row.currentMood.image}
              alt="Mood"
              width={24}
              height={24}
            />
          ) : (
            <FaQuestion size={24} color="gray" />
          )}
        </div>
      ),
    },
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
        ניהול משתמשים
      </h1>
      {users.length === 0 ? (
        <Alert variant="default">
          <AlertTitle>אין משתמשים</AlertTitle>
          <AlertDescription>
            לא נמצאו משתמשים קיימים, נא להוסיף משתמשים
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <DataTable
            title="משתמשים"
            data={users}
            columnConfig={columnConfig}
            onCreateRecord={handleCreateUser}
            onEditRecord={handleEditUser}
            onDeleteRecord={handleDeleteUser}
            disableCreation={true}
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent
              aria-describedby="dialog-description"
              className="max-w-full sm:max-w-lg"
            >
              <DialogHeader>
                <DialogTitle>
                  קטגוריות המשתמש: {selectedUser?.displayName}
                </DialogTitle>
              </DialogHeader>
              <div id="dialog-description" className="overflow-x-auto">
                <Table>
                  <TableHeader dir="rtl">
                    <TableRow className="min-w-full">
                      <TableHead className="text-right">שם הקטגוריה</TableHead>
                      <TableHead className="text-right">דירוג</TableHead>
                      <TableHead className="text-right">בעבודה</TableHead>
                      <TableHead className="text-right">מטרות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody dir="rtl">
                    {selectedUser?.categories.map(
                      (category: CategoryDocument) => (
                        <TableRow key={category.id}>
                          <TableCell>{category.name}</TableCell>
                          <TableCell>{category.grade}</TableCell>
                          <TableCell>{category.active ? "כן" : "לא"}</TableCell>
                          <TableCell>
                            <ul className="list-disc list-inside">
                              {selectedUser.goals
                                .filter(
                                  (goal: GoalDocument) =>
                                    goal.categoryId === category.id
                                )
                                .map((goal: GoalDocument) => (
                                  <li key={goal.id}>{goal.name}</li>
                                ))}
                              {selectedUser.goals.filter(
                                (goal: GoalDocument) =>
                                  goal.categoryId === category.id
                              ).length === 0 && (
                                <li className="text-muted-foreground">
                                  לא הוגדרו מטרות לקטגוריה זו
                                </li>
                              )}
                            </ul>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}