"use client";

import { useState } from "react";
import { DataTable } from "@/components/general/data-table";
import { CategoryDocument, ColumnConfig, GoalDocument } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDocument, deleteDocument, updateDocument } from "@/app/utils/firestore";

interface CategoriesTableProps {
  initialCategories: CategoryDocument[];
  initialGoals: GoalDocument[];
  accessToken: string;
}

export default function CategoriesTable({
  initialCategories,
  initialGoals,
  accessToken,
}: CategoriesTableProps) {
  const [categories, setCategories] =
    useState<CategoryDocument[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryDocument | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [goals, setGoals] = useState<Partial<GoalDocument>[]>(initialGoals);
  const [isSavingGoals, setIsSavingGoals] = useState(false);

  const handleCreateCategory = async (category: CategoryDocument) => {
    try {
      const newCategory = {
        ...category,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log(newCategory);

      await createDocument("initial-categories", newCategory, accessToken);
      setCategories([...categories, newCategory]);

      // Assign three blank goals to the new category
      const newGoals = Array.from({ length: 3 }, (_, index) => ({
        id: `${newCategory.id}-goal-${index + 1}`,
        categoryId: newCategory.name,
        name: `כותרת למטרה ${index + 1}`,
        description: `כותרת לתיאור ${index + 1}`,
      }));

      const createGoalPromises = newGoals.map(goal =>
        createDocument("initial-goals", goal, accessToken)
      );

      await Promise.all(createGoalPromises);
      setGoals([...goals, ...newGoals]);
    } catch (error) {
      console.error("Error creating category: ", error);
    }
  };

  const handleEditCategory = async (
    index: number,
    category: CategoryDocument
  ) => {
    try {
      const updatedCategory = {
        ...category,
        updatedAt: new Date(),
      };
      console.log(updatedCategory);
      await updateDocument("initial-categories", category.id, updatedCategory, accessToken);
      const updatedCategories = [...categories];
      updatedCategories[index] = updatedCategory;
      setCategories(updatedCategories);
    } catch (error) {
      console.error("Error updating category: ", error);
    }
  };

  const handleDeleteCategory = async (category: CategoryDocument) => {
    try {
      await deleteDocument("initial-categories", category.id, accessToken);
      const updatedCategories = categories.filter(
        (cat) => cat.id !== category.id
      );
      setCategories(updatedCategories);

      // Remove corresponding goals from 'initial-goals'
      const categoryGoals = goals.filter(goal => goal.categoryId === category.name);
      const deleteGoalPromises = categoryGoals.map(goal =>
        deleteDocument("initial-goals", goal.id!, accessToken)
      );

      await Promise.all(deleteGoalPromises);
      const updatedGoals = goals.filter(goal => goal.categoryId !== category.name);
      setGoals(updatedGoals);
    } catch (error) {
      console.error("Error deleting category: ", error);
    }
  };

  const handleViewGoals = (category: CategoryDocument) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleGoalChange = (goalId: string, field: keyof GoalDocument, value: string) => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) =>
        goal.id === goalId ? { ...goal, [field]: value } : goal
      )
    );
  };

  const handleSaveGoals = async () => {
    setIsSavingGoals(true);
    try {
      const updatedGoals = goals.filter(goal => goal.categoryId === selectedCategory?.name);
      const updatePromises = updatedGoals.map(goal => updateDocument("initial-goals", goal.id!  , goal, accessToken));
      await Promise.all(updatePromises);

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving goals: ", error);
    } finally {
      setIsSavingGoals(false);
    }
  };

  const columnConfig: Partial<Record<keyof CategoryDocument, ColumnConfig>> = {
    name: { label: "שם קטגוריה", inputType: "text", required: true },
    id: {
      label: "מטרות",
      inputType: "custom",
      isHiddenFromForm: true,
      customComponent: (category: CategoryDocument) => {
        return <Button onClick={() => handleViewGoals(category)}>צפה במטרות</Button>;
      },
    },
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">ניהול קטגוריות</h1>
      <DataTable
        title="קטגוריות"
        data={categories}
        columnConfig={columnConfig}
        onCreateRecord={handleCreateCategory}
        onEditRecord={handleEditCategory}
        onDeleteRecord={handleDeleteCategory}
      />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מטרות הקטגוריה: {selectedCategory?.name}</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">שם המטרה</TableHead>
                <TableHead className="text-right">תיאור</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody dir="rtl">
              {goals
                .filter((goal) => goal.categoryId === selectedCategory?.name)
                .map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell className="text-right">
                      <Input
                        value={goal.name}
                        onChange={(e) =>
                          handleGoalChange(goal.id!, "name", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        value={goal.description}
                        onChange={(e) =>
                          handleGoalChange(goal.id!, "description", e.target.value)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <Button onClick={handleSaveGoals} disabled={isSavingGoals}>
            {isSavingGoals ? "שומר..." : "שמור שינויים"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
