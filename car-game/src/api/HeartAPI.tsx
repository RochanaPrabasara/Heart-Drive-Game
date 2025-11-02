import axios from 'axios';

export interface HeartChallenge {
  imageUrl: string;
  solution: number;
}

const HEART_API = 'https://marcconrad.com/uob/heart/api.php?out=json&base64=no';

const FALLBACK_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjk5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGxbPSIjYjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SGVhcnQgQVBJIEZhaWxlZDwvdGV4dD48L3N2Zz4=';

 //Fetches a new heart-count challenge from the external API.
 //Returns a fallback challenge if the request fails.

export const fetchHeartChallenge = async (): Promise<HeartChallenge> => {
  try {
    const res = await axios.get(HEART_API);
    const { question, solution } = res.data;
    return {
      imageUrl: question,
      solution: parseInt(solution, 10),
    };
  } catch (err) {
    console.error('Heart API failed:', err);
    return {
      imageUrl: FALLBACK_IMAGE,
      solution: 3,
    };
  }
};