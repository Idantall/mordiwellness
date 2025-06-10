import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface DocumentWithId extends FirebaseFirestoreTypes.DocumentData {
    id: string;
}

export interface QueryOptions {
    filters?: { field: string; operator: FirebaseFirestoreTypes.WhereFilterOp; value: any }[];
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    limitTo?: number;
}

// Create Document
export const createDocument = async <T extends FirebaseFirestoreTypes.DocumentData>(
    collectionName: string,
    data: T
): Promise<string> => {
    try {
        const docRef = await firestore().collection(collectionName).add(data);
        console.log('Document written with ID: ', docRef.id);
        return docRef.id;
    } catch (e) {
        console.error('Error adding document: ', e);
        throw e;
    }
};

// Read Document
export const readDocument = async <T extends FirebaseFirestoreTypes.DocumentData>(
    collectionName: string,
    docId: string
): Promise<T | null> => {
    try {
        const docRef = firestore().collection(collectionName).doc(docId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            return docSnap.data() as T;
        } else {
            console.log('No such document!');
            return null;
        }
    } catch (e) {
        console.error('Error reading document: ', e);
        throw e;
    }
};

// Read All Documents
export const readAllDocuments = async <T extends FirebaseFirestoreTypes.DocumentData>(
    collectionName: string,
    queryOptions?: QueryOptions
): Promise<DocumentWithId[]> => {
    try {
        let query: FirebaseFirestoreTypes.Query = firestore().collection(collectionName);

        if (queryOptions) {
            if (queryOptions.filters) {
                queryOptions.filters.forEach(filter => {
                    query = query.where(filter.field, filter.operator, filter.value);
                });
            }

            if (queryOptions.orderByField) {
                query = query.orderBy(queryOptions.orderByField, queryOptions.orderDirection || 'asc');
            }

            if (queryOptions.limitTo) {
                query = query.limit(queryOptions.limitTo);
            }
        }

        const querySnapshot = await query.get();
        const documents: DocumentWithId[] = [];
        querySnapshot.forEach(doc => {
            documents.push({ id: doc.id, ...doc.data() as T });
        });
        return documents;
    } catch (e) {
        console.error('Error reading documents: ', e);
        throw e;
    }
};

// Update Document
export const updateDocument = async <T extends FirebaseFirestoreTypes.DocumentData>(
    collectionName: string,
    docId: string,
    updatedData: Partial<T>
): Promise<void> => {
    try {
        const docRef = firestore().collection(collectionName).doc(docId);
        await docRef.update(updatedData);
        console.log('Document updated with ID: ', docId);
    } catch (e) {
        console.error('Error updating document: ', e);
        throw e;
    }
};

// Delete Document
export const deleteDocument = async (
    collectionName: string,
    docId: string
): Promise<void> => {
    try {
        const docRef = firestore().collection(collectionName).doc(docId);
        await docRef.delete();
        console.log('Document deleted with ID: ', docId);
    } catch (e) {
        console.error('Error deleting document: ', e);
        throw e;
    }
};
