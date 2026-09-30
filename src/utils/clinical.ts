// Clinical calculation algorithms, ICD-10 diagnostic library, and triage scoring for Phase 2

import { VitalSigns, LabResultItem } from '../types/clinic';

export interface BMICalculation {
  bmi: number;
  category: 'Underweight' | 'Normal' | 'Overweight' | 'Obese Class I' | 'Obese Class II+';
  color: string;
  badgeClass: string;
  description: string;
}

export function calculateBMI(weightKg?: number, heightCm?: number): BMICalculation | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

  if (bmi < 18.5) {
    return {
      bmi,
      category: 'Underweight',
      color: '#d97706',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'Below healthy weight threshold (< 18.5 kg/m²). Nutrition assessment indicated.',
    };
  } else if (bmi <= 24.9) {
    return {
      bmi,
      category: 'Normal',
      color: '#059669',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'Healthy adult BMI range (18.5 - 24.9 kg/m²).',
    };
  } else if (bmi <= 29.9) {
    return {
      bmi,
      category: 'Overweight',
      color: '#ea580c',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
      description: 'Elevated weight range (25.0 - 29.9 kg/m²). Dietary lifestyle counseling suggested.',
    };
  } else if (bmi <= 34.9) {
    return {
      bmi,
      category: 'Obese Class I',
      color: '#dc2626',
      badgeClass: 'bg-red-100 text-red-800 border-red-300 font-bold',
      description: 'Moderate obesity risk (30.0 - 34.9 kg/m²). Comorbidity screen indicated.',
    };
  } else {
    return {
      bmi,
      category: 'Obese Class II+',
      color: '#991b1b',
      badgeClass: 'bg-rose-900 text-rose-100 border-rose-700 font-bold animate-pulse',
      description: 'Severe obesity risk (≥ 35.0 kg/m²). High cardiovascular risk profile.',
    };
  }
}

export interface TriageEvaluation {
  level: number;
  category: 'Immediate (Red)' | 'Emergent (Orange)' | 'Urgent (Yellow)' | 'Standard (Green)';
  badgeClass: string;
  dotColor: string;
  textColor: string;
  reasons: string[];
}

export function evaluateTriageLevel(vitals: VitalSigns): TriageEvaluation {
  const reasons: string[] = [];

  const temp = vitals.temperature || 37;
  const sysBp = vitals.bloodPressureSystolic || 120;
  const diaBp = vitals.bloodPressureDiastolic || 80;
  const hr = vitals.pulseRate || 75;
  const spo2 = vitals.oxygenSaturation || 98;
  const rr = vitals.respiratoryRate || 16;
  const glucose = vitals.bloodGlucose;
  const pain = vitals.painScore || 0;

  // Level 1: Immediate / Resuscitation (Red)
  if (spo2 < 90) reasons.push(`Severe Hypoxia (SpO2 ${spo2}% < 90%)`);
  if (hr > 140 || (hr < 40 && hr > 0)) reasons.push(`Severe Dysrhythmia / Extreme HR (${hr} bpm)`);
  if (sysBp < 80) reasons.push(`Hypotensive Shock (Systolic BP ${sysBp} < 80 mmHg)`);
  if (glucose && glucose < 50) reasons.push(`Severe Hypoglycemia (${glucose} mg/dL < 50)`);

  if (reasons.length > 0) {
    return {
      level: 1,
      category: 'Immediate (Red)',
      badgeClass: 'bg-red-600 text-white border-red-700 font-black animate-pulse',
      dotColor: '#ef4444',
      textColor: 'text-red-600',
      reasons,
    };
  }

  // Level 2: Emergent (Orange)
  if (sysBp >= 170 || diaBp >= 110) reasons.push(`Hypertensive Urgency (${sysBp}/${diaBp} mmHg)`);
  if (spo2 <= 94) reasons.push(`Borderline Hypoxia (SpO2 ${spo2}%)`);
  if (hr >= 115) reasons.push(`Significant Tachycardia (${hr} bpm)`);
  if (temp >= 39.0) reasons.push(`High Hyperpyrexia (${temp}°C ≥ 39.0°C)`);
  if (temp <= 35.0) reasons.push(`Hypothermia (${temp}°C ≤ 35.0°C)`);
  if (rr >= 28 || rr < 10) reasons.push(`Respiratory Distress (${rr}/min)`);
  if (glucose && glucose >= 300) reasons.push(`Severe Hyperglycemia (${glucose} mg/dL ≥ 300)`);
  if (pain >= 8) reasons.push(`Severe Acute Pain (Score ${pain}/10)`);

  if (reasons.length > 0) {
    return {
      level: 2,
      category: 'Emergent (Orange)',
      badgeClass: 'bg-orange-500 text-white border-orange-600 font-bold',
      dotColor: '#f97316',
      textColor: 'text-orange-500',
      reasons,
    };
  }

  // Level 3: Urgent (Yellow)
  if (sysBp >= 140 || diaBp >= 90) reasons.push(`Stage 1/2 Hypertension (${sysBp}/${diaBp} mmHg)`);
  if (temp >= 38.0) reasons.push(`Febrile State (${temp}°C)`);
  if (hr >= 100) reasons.push(`Mild Tachycardia (${hr} bpm)`);
  if (glucose && glucose >= 180) reasons.push(`Elevated Glucose (${glucose} mg/dL)`);
  if (pain >= 5) reasons.push(`Moderate Pain (Score ${pain}/10)`);

  if (reasons.length > 0) {
    return {
      level: 3,
      category: 'Urgent (Yellow)',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-400 font-semibold',
      dotColor: '#f59e0b',
      textColor: 'text-amber-600',
      reasons,
    };
  }

  // Level 4: Standard / Routine (Green)
  return {
    level: 4,
    category: 'Standard (Green)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotColor: '#10b981',
    textColor: 'text-emerald-600',
    reasons: ['Vitals within normal physiological adult ranges.'],
  };
}

export interface ICD10Item {
  code: string;
  description: string;
  category: string;
  commonSymptoms: string;
  suggestedPlan: string;
}

export const ICD10_CATALOG: ICD10Item[] = [
  {
    code: 'I10',
    description: 'Essential (primary) hypertension',
    category: 'Cardiovascular',
    commonSymptoms: 'Occipital headache, dizziness, visual blurring, epistaxis',
    suggestedPlan: 'Lifestyle salt restriction, baseline renal/lipid panel, commence ACEi or Calcium Channel Blocker.',
  },
  {
    code: 'E11.9',
    description: 'Type 2 diabetes mellitus without complications',
    category: 'Endocrine',
    commonSymptoms: 'Polyuria, polydipsia, lethargy, blurred vision',
    suggestedPlan: 'Fasting lipid/glucose profile, HbA1c, dietary low-glycemic counseling, Metformin 500mg titration.',
  },
  {
    code: 'E11.65',
    description: 'Type 2 diabetes mellitus with hyperglycemia',
    category: 'Endocrine',
    commonSymptoms: 'Marked polyuria, dry mucous membranes, fatigue, random glucose > 200 mg/dL',
    suggestedPlan: 'Urgent IV rehydration, monitor urine ketones, sliding-scale insulin, daily glucose chart.',
  },
  {
    code: 'J06.9',
    description: 'Acute upper respiratory infection, unspecified (URI)',
    category: 'Respiratory',
    commonSymptoms: 'Rhinorrhea, sore throat, dry cough, mild low-grade fever',
    suggestedPlan: 'Supportive hydration, paracetamol for antipyresis, steam inhalation, warm fluids. Avoid antibiotics unless bacterial.',
  },
  {
    code: 'J18.9',
    description: 'Pneumonia, unspecified organism',
    category: 'Respiratory',
    commonSymptoms: 'Productive purulent cough, pleuritic chest pain, fever > 38.5°C, tachypnea',
    suggestedPlan: 'Order urgent CBC, pulse oximetry, chest radiograph, initiate empiric Amoxicillin-Clavulanate or Ceftriaxone.',
  },
  {
    code: 'J45.909',
    description: 'Bronchial asthma, uncomplicated',
    category: 'Respiratory',
    commonSymptoms: 'Expiratory wheeze, nocturnal dyspnea, chest tightness',
    suggestedPlan: 'Immediate Salbutamol nebulization (2.5mg), assess post-bronchodilator peak flow, inhaled corticosteroid controller.',
  },
  {
    code: 'A09',
    description: 'Infectious gastroenteritis and colitis, unspecified',
    category: 'Gastrointestinal',
    commonSymptoms: 'Watery diarrhea ≥ 4 stools/day, cramping abdominal pain, nausea, mild dehydration',
    suggestedPlan: 'Oral Rehydration Solution (ORS), Zinc supplementation, stool microscopy, monitor hydration status.',
  },
  {
    code: 'B54',
    description: 'Unspecified malaria (Plasmodium falciparum / vivax)',
    category: 'Infectious / Parasitic',
    commonSymptoms: 'Intermittent high fever with rigors, profuse sweating, arthralgia, headache',
    suggestedPlan: 'Stat Malaria Rapid Diagnostic Test / Blood Film, Artemether-Lumefantrine (ACT) full course, antipyretics.',
  },
  {
    code: 'K29.7',
    description: 'Gastritis, unspecified / Peptic ulcer disease',
    category: 'Gastrointestinal',
    commonSymptoms: 'Epigastric burning pain aggravated or relieved by meals, postprandial fullness, heartburn',
    suggestedPlan: 'Proton Pump Inhibitor (Omeprazole 20mg BD), avoid NSAIDs and spicy food, consider H. pylori antigen testing.',
  },
  {
    code: 'N39.0',
    description: 'Urinary tract infection, site not specified',
    category: 'Genitourinary',
    commonSymptoms: 'Dysuria, urinary frequency, urgency, suprapubic tenderness',
    suggestedPlan: 'Urinalysis dipstick + microscopy (leukocytes/nitrites), encourage fluid intake, Ciprofloxacin or Nitrofurantoin.',
  },
  {
    code: 'M54.5',
    description: 'Low back pain (Lumbago / mechanical lumbar strain)',
    category: 'Musculoskeletal',
    commonSymptoms: 'Paravertebral muscular spasm, limitation of spinal flexion, absence of red flags (no bowel/bladder loss)',
    suggestedPlan: 'Short course NSAID + muscle relaxant, gentle mobilization, core stability ergonomics.',
  },
  {
    code: 'L03.90',
    description: 'Cellulitis / acute soft tissue bacterial infection',
    category: 'Dermatological',
    commonSymptoms: 'Erythematous, warm, tender localized skin swelling with indistinct margins',
    suggestedPlan: 'Outline margins with surgical pen, elevate limb, systemic Flucloxacillin or Cefazolin, wound dressing.',
  },
];

export interface LabParameterEval {
  isAbnormal: boolean;
  isCritical: boolean;
  flag: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH';
  flagLabel: string;
  flagClass: string;
}

export function evaluateLabValue(
  valueStr: string,
  referenceRange: string,
  criticalLow?: number,
  criticalHigh?: number
): LabParameterEval {
  const num = parseFloat(valueStr);

  if (isNaN(num)) {
    // String qualitative check
    const lower = valueStr.toLowerCase();
    if (lower.includes('positive') || lower.includes('reactive') || lower.includes('detected') || lower.includes('1:160') || lower.includes('1:320')) {
      return {
        isAbnormal: true,
        isCritical: lower.includes('reactive') && (lower.includes('hiv') || lower.includes('hcv')),
        flag: 'HIGH',
        flagLabel: '[+] POSITIVE',
        flagClass: 'bg-red-100 text-red-800 font-bold',
      };
    }
    return {
      isAbnormal: false,
      isCritical: false,
      flag: 'NORMAL',
      flagLabel: 'Normal',
      flagClass: 'text-emerald-700',
    };
  }

  // Parse reference range min/max if numeric format (e.g. "12.0 - 16.5" or "< 200" or "> 40")
  let rangeMin: number | null = null;
  let rangeMax: number | null = null;

  if (referenceRange.includes('-')) {
    const parts = referenceRange.split('-').map((s) => parseFloat(s.trim()));
    if (!isNaN(parts[0])) rangeMin = parts[0];
    if (!isNaN(parts[1])) rangeMax = parts[1];
  } else if (referenceRange.startsWith('<')) {
    const maxVal = parseFloat(referenceRange.replace('<', '').trim());
    if (!isNaN(maxVal)) rangeMax = maxVal;
  } else if (referenceRange.startsWith('>')) {
    const minVal = parseFloat(referenceRange.replace('>', '').trim());
    if (!isNaN(minVal)) rangeMin = minVal;
  }

  // Check critical thresholds first
  if (criticalLow !== undefined && num < criticalLow) {
    return {
      isAbnormal: true,
      isCritical: true,
      flag: 'CRITICAL_LOW',
      flagLabel: 'CRITICAL LOW [PANIC]',
      flagClass: 'bg-red-600 text-white font-black animate-pulse px-2 py-0.5 rounded text-[10px]',
    };
  }

  if (criticalHigh !== undefined && num > criticalHigh) {
    return {
      isAbnormal: true,
      isCritical: true,
      flag: 'CRITICAL_HIGH',
      flagLabel: 'CRITICAL HIGH [PANIC]',
      flagClass: 'bg-red-600 text-white font-black animate-pulse px-2 py-0.5 rounded text-[10px]',
    };
  }

  // Check normal bounds
  if (rangeMin !== null && num < rangeMin) {
    return {
      isAbnormal: true,
      isCritical: false,
      flag: 'LOW',
      flagLabel: '[L] Low',
      flagClass: 'bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[10px]',
    };
  }

  if (rangeMax !== null && num > rangeMax) {
    return {
      isAbnormal: true,
      isCritical: false,
      flag: 'HIGH',
      flagLabel: '[H] High',
      flagClass: 'bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[10px]',
    };
  }

  return {
    isAbnormal: false,
    isCritical: false,
    flag: 'NORMAL',
    flagLabel: 'Normal',
    flagClass: 'text-emerald-700 font-medium text-[10px]',
  };
}

export const NURSING_CARE_PROCEDURES = [
  'Wound Debridement & Sterile Antiseptic Dressing',
  'Salbutamol Nebulization (2.5mg/2.5ml in Oxygen)',
  'Peripheral IV Cannulation (20G) & Patency Flush',
  'IV Normal Saline 500ml Infusion Initiated (40 dpm)',
  'Tetanus Toxoid 0.5ml IM Deltoid Injection',
  'Stat Paracetamol 1g PO + Cold Sponging for Hyperpyrexia',
  'Blood Glucose Fingerprick Monitoring & Sliding Scale Chart',
  'Indwelling Foley Catheterization 16Fr with Urometer',
];

export const MAR_ROUTES = [
  'Oral (PO)',
  'IV Bolus',
  'IV Infusion / Drip',
  'Intramuscular (IM)',
  'Subcutaneous (SC)',
  'Inhalation / Nebulizer',
  'Topical / Wound Bed',
  'Ophthalmic Drops',
];
