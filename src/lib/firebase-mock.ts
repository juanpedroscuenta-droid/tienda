// Este archivo es un mock para evitar que Vite rompa al encontrar imports de Firebase.
// Como estamos usando Supabase exclusivamente, todo el código de firebase se puede "saltar".

export const collection = () => ({});
export const getDocs = async () => ({ docs: [] });
export const query = () => ({});
export const where = () => ({});
export const orderBy = () => ({});
export const limit = () => ({});
export const Timestamp = { now: () => ({ toMillis: () => 0 }) };
export const doc = () => ({});
export const getDoc = async () => ({ exists: () => false, data: () => ({}) });
export const setDoc = async () => ({});
export const addDoc = async () => ({ id: 'mock' });
export const updateDoc = async () => ({});
export const deleteDoc = async () => ({});
export const serverTimestamp = () => ({});
export const onSnapshot = () => () => { };
export const writeBatch = () => ({ commit: async () => { }, update: () => { }, set: () => { }, delete: () => { } });

export const getAuth = () => ({});
export const createUserWithEmailAndPassword = async () => ({ user: {} });
export const signInWithEmailAndPassword = async () => ({ user: {} });
export const signOut = async () => ({});
export const onAuthStateChanged = () => () => { };
export const sendPasswordResetEmail = async () => { };
export const sendEmailVerification = async () => { };

export const ref = () => ({});
export const uploadBytesResumable = () => ({ on: () => { }, then: async () => ({}) });
export const getDownloadURL = async () => 'https://mock.image.url';
export const deleteObject = async () => ({});
export const runTransaction = async () => ({});
export const increment = (n: number) => n;
export const arrayUnion = (...args: any[]) => args;
export const arrayRemove = (...args: any[]) => args;
