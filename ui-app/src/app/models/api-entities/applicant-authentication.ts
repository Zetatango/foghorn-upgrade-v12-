export interface ApplicantAuthentication {
  guid: string;
  questions: AuthenticationQuestion[];
}

export interface AuthenticationQuestion {
  id: number;
  question_text: string;
  answers: AuthenticationQuestionAnswer[];
}

export interface AuthenticationQuestionAnswer {
  id: number;
  answer_text: string;
  correct_answer: boolean;
}
