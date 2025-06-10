"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { SendMessageForm } from "@/components/sms/SendMessageForm";
import { CreateSmsMessageForm } from "@/components/sms/CreateSmsMessageForm";
import {
  EditMessageForm,
  MessageWithHours,
} from "@/components/sms/EditMessageForm";
import { Message, Account } from "@/types";
import { MessageCircleReply, Pencil, PlusCircle } from "lucide-react";

interface SmsManagmentClientProps {
  users: Account[];
  messages: Message[];
  accessToken: string;
}

export default function SmsManagmentClient({
  users,
  messages,
  accessToken,
}: SmsManagmentClientProps) {
  const usersWhoApprovedNotifications = users.filter(
    (user) => user.fcmToken !== null && typeof user.fcmToken === "string"
  );

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedMessageEdit, setSelectedMessageEdit] =
    useState<MessageWithHours | null>(null);
  const [messageList, setMessageList] = useState<Message[]>(messages);
  const sendMessageFormState = useState<boolean>(false);
  const createMessageFormState = useState<boolean>(false);
  const editMessageFormState = useState<boolean>(false);

  const addMessage = (message: MessageWithHours) => {
    setMessageList((prevMessages) => [...prevMessages, message]);
  };

  const editMessage = (updatedMessage: MessageWithHours) => {
    setMessageList((prevMessages) =>
      prevMessages.map((message) =>
        message.id === updatedMessage.id ? updatedMessage : message
      )
    );
  };

  const deleteMessage = (messageId: string) => {
    setMessageList((prevMessages) =>
      prevMessages.filter((message) => message.id !== messageId)
    );
  };

  const handleEditMessage = (message: MessageWithHours) => {
    setSelectedMessageEdit(message);
    editMessageFormState[1](true);
  };

  const handleCloseEditDialog = () => {
    setSelectedMessageEdit(null);
    editMessageFormState[1](false);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {selectedMessage && (
        <SendMessageForm
          message={selectedMessage}
          state={sendMessageFormState}
          users={usersWhoApprovedNotifications}
        />
      )}
      <CreateSmsMessageForm
        accessToken={accessToken}
        state={createMessageFormState}
        addMessage={addMessage}
      />
      {selectedMessageEdit && (
        <EditMessageForm
          message={selectedMessageEdit as MessageWithHours}
          state={[editMessageFormState[0], handleCloseEditDialog]}
          editMessage={editMessage}
          deleteMessage={deleteMessage}
        />
      )}
      <div className="w-full h-full flex flex-col justify-center items-start gap-6">
        <Alert variant="destructive">
          <AlertTitle>הודעות אוטומטיות</AlertTitle>
          <AlertDescription>
            הודעות אוטומטיות שהוגדרו באפיון אינן מוצגות כאן, מכיוון שהן הוגדרו
            ידנית בקוד.
            <br />
            כאן ניתן להוסיף הודעה אוטומטית יומית לפי שעה מוגדרת.
          </AlertDescription>
        </Alert>
        <div className="w-full flex flex-row justify-between items-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            ניהול התראות אפליקציה
          </h1>
          <Button onClick={() => createMessageFormState[1](true)}>
            צור הודעה חדשה <PlusCircle />
          </Button>
        </div>

        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableCell className="text-right font-bold">סוג הודעה</TableCell>
              <TableCell className="text-right font-bold">
                כותרת ההודעה
              </TableCell>
              <TableCell className="text-right font-bold">גוף ההודעה</TableCell>
              <TableCell className="text-right font-bold">
                שעת שליחה
              </TableCell>
              <TableCell className="text-right font-bold">פעולות</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(messageList as MessageWithHours[]).map((message, index) => (
              <TableRow key={index}>
                <TableCell className="text-right">{message.label}</TableCell>
                <TableCell className="text-right">
                  {message.notification.title}
                </TableCell>
                <TableCell
                  className="text-right"
                  title={message.notification.body}
                >
                  {message.notification.body.substring(0, 30).concat("..")}
                </TableCell>
                <TableCell className="text-right">
                  {message.atHour ? (
                    message.atHour
                  ) : (
                    <Badge>הודעה אוטומטית</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <span className="flex flex-row justify-start items-center gap-4">
                    <Button
                      onClick={() => handleEditMessage(message)}
                      variant="default"
                    >
                      עריכת הודעה <Pencil />
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedMessage(message);
                        sendMessageFormState[1](true);
                      }}
                      variant="outline"
                    >
                      שלח הודעה באופן ידני <MessageCircleReply />
                    </Button>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
