export interface Movie {
  id: number;
  year: number;
  title: string;
  studios: string[];
  producers: string[];
  winner: boolean;
}

export interface MoviePage {
  content: Movie[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
}

export interface MovieQuery {
  page: number;
  size: number;
  winner?: boolean;
  year?: number;
}

export interface YearWinnerCount {
  year: number;
  winnerCount: number;
}

export interface StudioWinCount {
  name: string;
  winCount: number;
}

export interface ProducerInterval {
  producer: string;
  interval: number;
  previousWin: number;
  followingWin: number;
}

export interface ProducerIntervals {
  min: ProducerInterval[];
  max: ProducerInterval[];
}
