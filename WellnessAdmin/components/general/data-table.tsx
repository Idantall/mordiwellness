import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Edit,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, isValid } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Form } from "@/components/ui/form";
import { ColumnConfig } from "@/types";

interface DataTableProps<T extends Record<string, any>> {
  title?: string;
  data: T[];
  columnConfig: Partial<Record<keyof T, ColumnConfig>>;
  onCreateRecord: (record: T) => Promise<void>;
  onEditRecord: (index: number, record: T) => Promise<void>;
  onDeleteRecord: (record: T) => Promise<void>;
  itemsPerPage?: number;
  disableCreation?: boolean;
}

// Utility function to fix and validate schemas
function fixAndParseSchema<T extends Record<string, any>>(
  data: T,
  columnConfig: Partial<Record<keyof T, ColumnConfig>>
): z.ZodObject<any> {
  const schemaFields: Record<string, z.ZodType> = {};

  Object.keys(columnConfig).forEach((column) => {
    const config = columnConfig[column as keyof T];

    // Determine appropriate schema based on input type and current value
    let fieldSchema: z.ZodType;

    switch (config?.inputType) {
      case "date":
        fieldSchema = z
          .union([
            z.date(),
            z.string().transform((val) => {
              const date = new Date(val);
              return isNaN(date.getTime()) ? null : date;
            }),
          ])
          .nullable();
        break;
      case "number":
        fieldSchema = z.coerce.number().optional();
        break;
      case "boolean":
        fieldSchema = z.boolean().optional();
        break;
      case "select":
        // If it's a select, ensure the value is one of the options
        const options = config.options?.map((opt) => opt.value) || [];
        fieldSchema = z.enum(options as [string, ...string[]]).optional();
        break;
      default:
        // Default to string with some basic cleaning
        fieldSchema = z
          .string()
          .transform((val) => (val ? val.trim() : ""))
          .optional();
    }

    // Add to schema fields
    schemaFields[column] = fieldSchema;
  });

  // Create and return the schema
  return z.object(schemaFields);
}

export function DataTable<T extends Record<string, any>>({
  title,
  data: initialData,
  columnConfig,
  onCreateRecord,
  onEditRecord,
  onDeleteRecord,
  itemsPerPage = 10,
  disableCreation = false,
}: DataTableProps<T>) {
  const [data, setData] = useState(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchColumn, setSearchColumn] = useState<keyof T | "">("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const columns = Object.keys(columnConfig) as (keyof T)[];

  const createFormSchema = () => {
    const baseSchema = z.object(
      Object.fromEntries(
        columns
          .filter((column) => !columnConfig[column]?.isHiddenFromForm)
          .map((column) => {
            const config = columnConfig[column];
            let fieldSchema;
            switch (config?.inputType) {
              case "date":
                fieldSchema = z
                  .union([
                    z.date(),
                    z.string().transform((str) => new Date(str)),
                  ])
                  .nullable()
                  .optional();
                break;
              case "select":
                fieldSchema = z.string();
                break;
              case "number":
                fieldSchema = z.coerce.number();
                break;
              case "boolean":
                fieldSchema = z.boolean();
                break;
              default:
                fieldSchema = z.string().min(1, `שדה חובה`);
            }
            return [
              column,
              config?.required ? fieldSchema : fieldSchema.optional(),
            ];
          })
      )
    );

    return baseSchema;
  };

  const schema = createFormSchema();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(
      columns.map((column) => {
        const config = columnConfig[column];
        switch (config?.inputType) {
          case "date":
            return [column, new Date()];
          case "number":
            return [column, 0];
          case "boolean":
            return [column, false];
          default:
            return [column, ""];
        }
      })
    ) as z.infer<typeof schema>,
  });

  const editForm = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(
      columns.map((column) => {
        const config = columnConfig[column];
        switch (config?.inputType) {
          case "date":
            return [column, new Date()];
          case "number":
            return [column, 0];
          default:
            return [column, ""];
        }
      })
    ) as z.infer<typeof schema>,
  });

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!searchTerm) return true;
      if (!searchColumn) {
        return columns.some((column) =>
          String(item[column]).toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return String(item[searchColumn])
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm, searchColumn, columns]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleAddRecord = async (values: z.infer<typeof schema>) => {
    setIsCreating(true);
    try {
      // Use the schema fixing function to validate and clean the data
      const fixedSchema = fixAndParseSchema(values, columnConfig);
      console.log(fixedSchema);
      const parsedData = fixedSchema.parse(values);

      await onCreateRecord(parsedData as T);
      form.reset();
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        console.error("Validation Errors:", error.errors);
        // Optionally, you can set form errors here
        error.errors.forEach((err) => {
          form.setError(err.path[0] as keyof typeof form.control, {
            type: "manual",
            message: err.message,
          });
        });
      }
      throw error; // Re-throw for higher-level error handling
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditRecord = async (index: number, updatedRecord: T) => {
    setEditingIndex(index);
    try {
      // Use the schema fixing function to validate and clean the data
      const fixedSchema = fixAndParseSchema(updatedRecord, columnConfig);
      const parsedData = fixedSchema.parse(updatedRecord);

      await onEditRecord(index, parsedData as T);
      const newData = [...data];
      newData[index] = { ...newData[index], ...parsedData };
      setData(newData);
      setEditDialogOpen(false);
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        console.error("Validation Errors:", error.errors);
        // Optionally, you can set form errors here
        error.errors.forEach((err) => {
          editForm.setError(err.path[0] as keyof typeof editForm.control, {
            type: "manual",
            message: err.message,
          });
        });
      }
      throw error; // Re-throw for higher-level error handling
    } finally {
      setEditingIndex(null);
    }
  };

  const handleDeleteRecord = async (record: T) => {
    setDeletingIndex(data.indexOf(record));
    try {
      await onDeleteRecord(record);
      const newData = data.filter((item) => item !== record);
      setData(newData);
    } finally {
      setDeletingIndex(null);
    }
  };

  const renderInputField = (config: ColumnConfig, field: any) => {
    switch (config.inputType) {
      case "date":
        return (
          <FormItem>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(new Date(field.value), "PPP")
                    ) : (
                      <span>בחר תאריך</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </FormItem>
        );
      case "select":
        return (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="בחר אפשרות" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {config.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "number":
        return (
          <>
            <Input type="number" {...field} />
            {form.formState.errors[field.name] && (
              <p className="text-red-500">
                {form.formState.errors[field.name]?.message}
              </p>
            )}
          </>
        );
      case "custom":
        return config.customComponent;
      case "id":
        return <Input {...field} disabled />;
      case "boolean":
        return (
          <FormControl>
            <input
              type="checkbox"
              checked={!!field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          </FormControl>
        );
      default:
        return <Input {...field} />;
    }
  };

  const renderForm = (
    formContext: any,
    onSubmit: (values: any) => void,
    isSubmitting: boolean,
    isCreating: boolean
  ) => (
    <Form {...formContext}>
      <form onSubmit={formContext.handleSubmit(onSubmit)} className="space-y-4">
        {columns.map((column) => {
          const config = columnConfig[column];
          if (config?.isHiddenFromForm) {
            return null;
          }
          if (config?.inputType === "id" && isCreating) {
            return null;
          }
          if (!config?.required && isCreating) {
            return null;
          }
          return (
            <FormField
              key={column.toString()}
              control={formContext.control}
              name={column.toString()}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{config?.label || column.toString()}</FormLabel>
                  <FormControl>
                    {renderInputField(config!, field) as React.ReactNode}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isSubmitting ? "שומר..." : "שמור"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  const formatDate = (dateValue: any) => {
    const date = new Date(dateValue);
    return isValid(date) ? format(date, "dd/MM/yyyy HH:mm") : "Invalid Date";
  };

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader className="text-right">
        {title && <CardTitle className="text-right">{title}</CardTitle>}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-2 space-x-reverse gap-x-2">
            <Input
              placeholder="חיפוש..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64"
            />
            <Select
              value={searchColumn as string}
              onValueChange={(value) =>
                setSearchColumn(value === "all" ? "" : (value as keyof T))
              }
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="בחר עמודה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל העמודות</SelectItem>
                {columns.map((column) => (
                  <SelectItem key={column.toString()} value={column.toString()}>
                    {columnConfig[column]?.label || column.toString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!disableCreation && (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="ml-2 h-4 w-4" />
                  הוסף רשומה
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-right">
                    הוספת רשומה חדשה
                  </DialogTitle>
                  <DialogDescription className="text-right">
                    מלא את הפרטים הבאים כדי להוסיף רשומה חדשה.
                  </DialogDescription>
                </DialogHeader>
                {renderForm(form, handleAddRecord, isCreating, true)}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table className="w-full overflow-x-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">פעולות</TableHead>
              {columns.map((column) => (
                <TableHead key={column.toString()} className="text-right">
                  {columnConfig[column]?.label || column.toString()}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex space-x-2 space-x-reverse">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setEditingRecord(row);
                              editForm.reset(row);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>ערוך</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-right">
                            האם אתה בטוח שברצונך למחוק?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-right">
                            פעולה זו לא ניתנת לביטול. זה ימחק לצמיתות את הרשומה
                            הזו.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row-reverse">
                          <AlertDialogCancel>ביטול</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteRecord(row)}
                          >
                            {deletingIndex === data.indexOf(row) ? (
                              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            ) : null}
                            מחק
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
                {columns.map((column) => (
                  <TableCell key={column.toString()} className="text-right">
                    {columnConfig[column]?.inputType === "custom" &&
                    typeof columnConfig[column]?.customComponent === "function"
                      ? columnConfig[column]?.customComponent(row)
                      : columnConfig[column]?.inputType === "date"
                      ? formatDate(row[column])
                      : columnConfig[column]?.inputType === "select" &&
                        typeof row[column] === "boolean"
                      ? row[column]
                        ? "כן"
                        : "לא"
                      : row[column]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span>
              עמוד {currentPage} מתוך {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">עריכת רשומה</DialogTitle>
            <DialogDescription className="text-right">
              ערוך את הפרטים של הרשומה הנבחרת.
            </DialogDescription>
          </DialogHeader>
          {renderForm(
            editForm,
            (values) =>
              handleEditRecord(data.indexOf(editingRecord!), values as T),
            editingIndex !== null,
            false
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
