// import { runApifyActor } from "./getResults";

const synonyms = require("synonyms");

// Enum for date filters
enum DateFilter {
    Latest = 'last 2 months',
    Oldest = 'last 2 years',
    Lifetime = 'no date filter'
}

// List of basic stopwords (common words to ignore)
const stopwords = ['is', 'the', 'with', 'in', 'a', 'for', 'to', 'and', 'or', 'of', 'people', 'facing'];

// Function to extract main words from the sentence using a basic filter approach
function extractKeywords(sentence: string): string[] {
    // Convert the sentence to lowercase and split it into words
    const words = sentence.toLowerCase().split(/[\s,]+/);

    // Filter out stopwords and keep unique words
    const filteredWords = words.filter(word => !stopwords.includes(word));

    // Return unique keywords
    return Array.from(new Set(filteredWords));
}

// Function to get synonyms for both nouns and verbs
function getSynonyms(word: string, type: 'n' | 'v'): string[] {
    const synonymList = synonyms(word, type); // 'n' for nouns, 'v' for verbs
    return synonymList ? synonymList.slice(0, 3) : []; // Limit to 3 synonyms for brevity
}

// Function to determine if a word is a verb or noun using basic POS tagging
function classifyWord( ): 'n' | 'v' {
    // Placeholder logic for determining type, defaults to noun ('n')
    return 'n';
}

// Function to apply date filters in Google Dork
function getDateFilterString(dateFilter: DateFilter): string {
    const today = new Date();

    // Helper function to format date as 'YYYY-MM-DD'
    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Calculate the date 2 months ago
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 2); // Subtracting 2 months

    // Calculate the date 2 years ago
    const twoYearsAgo = new Date(today);
    twoYearsAgo.setFullYear(today.getFullYear() - 2); // Subtracting 2 years

    // Get formatted dates
    const todayStr = formatDate(today);
    const twoMonthsAgoStr = formatDate(twoMonthsAgo);
    const twoYearsAgoStr = formatDate(twoYearsAgo);

    switch (dateFilter) {
        case DateFilter.Latest:
            // Last 2 months
            return ` after:${twoMonthsAgoStr} before:${todayStr}`;
        case DateFilter.Oldest:
            // Last 2 years
            return ` after:${twoYearsAgoStr} before:${todayStr}`;
        case DateFilter.Lifetime:
            // No date filter
            return '';
        default:
            return '';
    }
}

// Function to convert a human query to a Google Dork with date filters, site restriction, and number of results
export function createGoogleDork(query: string,    ): string {
    // Extract keywords from the human query dynamically
    const keywords = extractKeywords(query);

    // Construct the Google Dork query based on extracted keywords
    const dorkParts = keywords.map(keyword => {
        const wordType = classifyWord( ); // Classify word as verb or noun (using a placeholder logic here)
        const synonymList = getSynonyms(keyword, wordType); // Get synonyms based on word type
        const combinedTerms = [keyword, ...synonymList].map(term => `"${term}"`); // Enclose each term in quotes
        return `(${combinedTerms.join(' OR ')})`; // Group related terms with parentheses
    });

    // Create the Google Dork query with site restriction, date filter, and result limit (if applicable)
    // const dateFilterString = getDateFilterString(dateFilter);
    return `${dorkParts.join(' ')}`;
    // return `site:${sitename} ${dorkParts.join(' ')}${dateFilterString} num=${resultLimit}`;
}

 