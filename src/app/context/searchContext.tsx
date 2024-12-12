// // SearchContext.tsx
// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
// import { db } from '@/app/firebaseClient';
// import { createGoogleDork } from '../dashboard/dorkingQuery';

// enum DateFilter {
//   Latest = 'last 2 months',
//   Oldest = 'last 2 years',
//   Lifetime = 'no date filter',
// }

// interface Post {
//   title: string;
//   link: string;
// }

// interface SearchContextProps {
//   searchQuery: string;
//   setSearchQuery: (query: string) => void;
//   currentFilter: string;
//   setCurrentFilter: (filter: string) => void;
//   redditData: Post[];
//   xData: Post[];
//   quoraData: Post[];
//   hnData: Post[];
//   devData: Post[];
//   handleSearch: () => Promise<void>;
//   handleBookmark: (post: Post) => Promise<void>;
//   credits: number;
//   isPremium: boolean;
//   showPremiumDialog: boolean;
//   handleGetPremium: () => void;
// }

// const SearchContext = createContext<SearchContextProps | undefined>(undefined);

// interface SearchProviderProps {
//   PremiumCheck: boolean;
//   userId: string;
//   children: React.ReactNode; // Add children here
// }

// export const SearchProvider: React.FC<SearchProviderProps> = ({ children, PremiumCheck, userId }) => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [currentFilter, setCurrentFilter] = useState('');
//   const [redditData, setRedditData] = useState<Post[]>([]);
//   const [xData, setXData] = useState<Post[]>([]);
//   const [quoraData, setQuoraData] = useState<Post[]>([]);
//   const [hnData, setHnData] = useState<Post[]>([]);
//   const [devData, setDevData] = useState<Post[]>([]);
//   const [credits, setCredits] = useState(0);
//   const [isPremium, setIsPremium] = useState(false);
//   const [showPremiumDialog, setShowPremiumDialog] = useState(false);

//   useEffect(() => {
//     fetchUserData();
//   }, [userId]);

//   useEffect(() => {
//     if (credits === 0 && !PremiumCheck) {
//       setShowPremiumDialog(true);
//     } else {
//       setShowPremiumDialog(false);
//     }
//   }, [credits, PremiumCheck]);

//   const fetchUserData = async () => {
//     const userDoc = await getDoc(doc(db, 'users', userId));
//     if (userDoc.exists()) {
//       const userData = userDoc.data();
//       setIsPremium(userData.isPremium || false);
//       setCredits(userData.credits || 0);
//     }
//   };

//   const updateCredits = async () => {
//     if (!isPremium && credits > 0) {
//       const newCredits = credits - 1;
//       await updateDoc(doc(db, 'users', userId), { credits: newCredits });
//       setCredits(newCredits);
//     }
//   };

//   const mapFilterToDate = (filter: string) => {
//     switch (filter) {
//       case 'newest':
//         return DateFilter.Latest;
//       case 'oldest':
//         return DateFilter.Oldest;
//       case 'lifetime':
//         return DateFilter.Lifetime;
//       default:
//         return DateFilter.Lifetime;
//     }
//   };

//   const fetchResult = async (query: string): Promise<Post[]> => {
//     try {
//       const responseForReddit = await fetch('/api/searchApify', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ query: query }),
//       });

//       const data = await responseForReddit.json();
//       const resultData = data.data;

//       if (data.success) {
//         return resultData;
//       } else {
//         throw new Error(data.error || 'Something went wrong');
//       }
//     } catch (err: any) {
//       console.log(err.message);
//       return [];
//     }
//   };

//   const handleSearch = async () => {
//     const dateFilter = mapFilterToDate(currentFilter);
//     if (!PremiumCheck && credits <= 0) {
//       setShowPremiumDialog(true);
//       return;
//     }

//     setRedditData([]);
//     setXData([]);
//     setQuoraData([]);
//     setHnData([]);
//     setDevData([]);

//     try {
//       const [redditResults, xResults, quoraResults, ihResults, devResults] = await Promise.all([
//         fetchResult(createGoogleDork(searchQuery, dateFilter, 10, 'reddit.com')),
//         fetchResult(createGoogleDork(searchQuery, dateFilter, 10, 'x.com')),
//         fetchResult(createGoogleDork(searchQuery, dateFilter, 10, 'quora.com')),
//         fetchResult(createGoogleDork(searchQuery, dateFilter, 10, 'news.ycombinator.com')),
//         fetchResult(createGoogleDork(searchQuery, dateFilter, 10, 'dev.to')),
//       ]);

//       setRedditData(redditResults);
//       setXData(xResults);
//       setQuoraData(quoraResults);
//       setHnData(ihResults);
//       setDevData(devResults);

//       await updateCredits();
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     }
//   };

//   const handleBookmark = async (post: Post) => {
//     try {
//       const userDocRef = doc(db, 'users', userId);
//       await updateDoc(userDocRef, {
//         bookmarks: arrayUnion({
//           title: post.title,
//           url: post.link,
//           createdAt: new Date(),
//         }),
//       });
//     } catch (error) {
//       console.error("Error adding bookmark:", error);
//     }
//   };

//   const handleGetPremium = () => {
//     window.location.href = '/checkout';
//   };

//   return (
//     <SearchContext.Provider
//       value={{
//         searchQuery,
//         setSearchQuery,
//         currentFilter,
//         setCurrentFilter,
//         redditData,
//         xData,
//         quoraData,
//         hnData,
//         devData,
//         handleSearch,
//         handleBookmark,
//         credits,
//         isPremium,
//         showPremiumDialog,
//         handleGetPremium,
//       }}
//     >
//       {children}
//     </SearchContext.Provider>
//   );
// };

// export const useSearch = () => {
//   const context = useContext(SearchContext);
//   if (!context) {
//     throw new Error('useSearch must be used within a SearchProvider');
//   }
//   return context;
// };
