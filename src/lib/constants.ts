import type { InstitutionType } from '@/types/database.types';

export interface Institution {
  id: string;
  type: InstitutionType;
  name: string;
  shortName: string;
  tagline: string;
}

export const INSTITUTIONS: Institution[] = [
  {
    id: 'darul_ulum',
    type: 'madrasa',
    name: 'মাদ্রাসায়ে ইসলামিয়া দারুল উলুম, কোম্পানিগঞ্জ।',
    shortName: 'মাদ্রাসা শাখা',
    tagline: 'কওমি ও হিফজুল কুরআন শাখা',
  },
  {
    id: 'al_helal',
    type: 'school',
    name: 'আল হেলাল ইংলিশ মিডিয়াম ইসলামিক স্কুল',
    shortName: 'স্কুল শাখা',
    tagline: 'ইংলিশ ভার্সন ও কম্বাইন্ড শিক্ষা',
  },
  {
    id: 'ayesha_siddika',
    type: 'mohila_madrasa',
    name: 'আয়েশা সিদ্দিকা মহিলা কওমি মাদ্রাসা',
    shortName: 'মহিলা মাদ্রাসা',
    tagline: 'মহিলা কওমি ও হিফজ শাখা',
  },
];
