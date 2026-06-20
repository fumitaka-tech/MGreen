export type PlantNameSuggestion = {
  nickname: string;
  species_name: string;
  confidence: "high" | "medium" | "low";
};

export type PlantRegistrationAnalysis = {
  suggestions: PlantNameSuggestion[];
  care_guide: string;
  current_status: string;
  recommendations: string[];
};

export type PlantByNameAnalysis = {
  suggested_nickname: string;
  care_guide: string;
  current_status: string;
  recommendations: string[];
};

export type PlantStatusAnalysis = {
  current_status: string;
  recommendations: string[];
  care_tips: string;
};

export type AiInsights = {
  current_status?: string;
  care_guide?: string;
  care_tips?: string;
  recommendations?: string[];
  analyzed_at?: string;
};
