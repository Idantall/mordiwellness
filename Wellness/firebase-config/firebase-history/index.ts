import { createDocument, QueryOptions, readAllDocuments, readDocument, updateDocument } from '@/firebase-config/firebase-generic';
import { ArchievedGrade } from 'types';

const collectionName = 'archived-grades';

export const getArchivedGrade = async (id: string) => {
    return await readDocument(collectionName, id) as ArchievedGrade;;
}

export const getArchivedGrades = async (queryOptions?: QueryOptions) => {
    return await readAllDocuments(collectionName, { ...queryOptions }) as ArchievedGrade[];
}

export const createArchivedGrade = async (archivedGrade: Partial<ArchievedGrade>) => {
    return await createDocument(collectionName, archivedGrade);
}

export const updateArchivedGrade = async (id: string, updateArchivedGrade: ArchievedGrade) => {
    return await updateDocument(collectionName, id, { ...updateArchivedGrade })
}
