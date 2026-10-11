'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Dumbbell,
  Info,
  BookOpen,
  Zap,
  Target,
  Timer,
  BarChart3,
  Trash2,
  Sparkles,
  BrainCircuit,
  CheckCircle2,
  AlertCircle,
  Activity,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  Layers,
} from 'lucide-react';
import { getPatientAnamneseAction } from '@/app/actions/prescribeDiet';
import { PacienteAnamneseDTO } from '@/utils/nutritionTypes';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────
interface Exercise {
  id: string;
  name: string;
  group: string;
  mechanics: 'Composto' | 'Isolador';
  equipment: string;
  primaryMuscle: string;
  secondaryMuscles: string;
}

interface PrescribedExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  rpe: number;
  rest: number;
}

interface WorkoutRoutine {
  id: string;
  name: string;
  exercises: PrescribedExercise[];
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — Inspirado em Delavier, Nick Evans e Jim Stoppani
// ─────────────────────────────────────────────────────────────────────────────
const EXERCISE_DATABASE: Exercise[] = [
  // ── PEITORAL (BARRAS, HALTERES, CABOS, MÁQUINAS, LIVRES) ──
  { id: 'pe01', name: 'Supino Reto com Barra', group: 'Peitoral', mechanics: 'Composto', equipment: 'Barra', primaryMuscle: 'Peitoral Maior (Feixe Esternocostal)', secondaryMuscles: 'Deltoide Anterior, Tríceps Braquial' },
  { id: 'pe02', name: 'Supino Inclinado com Barra (30° a 45°)', group: 'Peitoral', mechanics: 'Composto', equipment: 'Barra', primaryMuscle: 'Peitoral Maior (Feixe Clavicular - Superior)', secondaryMuscles: 'Deltoide Anterior, Tríceps' },
  { id: 'pe03', name: 'Supino Declinado com Barra', group: 'Peitoral', mechanics: 'Composto', equipment: 'Barra', primaryMuscle: 'Peitoral Maior (Feixe Inferior/Abdominal)', secondaryMuscles: 'Tríceps Braquial, Deltoide Anterior' },
  { id: 'pe04', name: 'Supino Reto com Halteres', group: 'Peitoral', mechanics: 'Composto', equipment: 'Halteres', primaryMuscle: 'Peitoral Maior (Maior amplitude & adução)', secondaryMuscles: 'Deltoide Anterior, Tríceps' },
  { id: 'pe05', name: 'Supino Inclinado com Halteres', group: 'Peitoral', mechanics: 'Composto', equipment: 'Halteres', primaryMuscle: 'Peitoral Maior (Porção Superior)', secondaryMuscles: 'Deltoide Anterior, Tríceps' },
  { id: 'pe06', name: 'Supino Declinado com Halteres', group: 'Peitoral', mechanics: 'Composto', equipment: 'Halteres', primaryMuscle: 'Peitoral Maior (Porção Inferior)', secondaryMuscles: 'Tríceps, Deltoide Anterior' },
  { id: 'pe07', name: 'Crucifixo Reto com Halteres', group: 'Peitoral', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Peitoral Maior (Alongamento Máximo)', secondaryMuscles: 'Deltoide Anterior (estabilizador)' },
  { id: 'pe08', name: 'Crucifixo Inclinado com Halteres', group: 'Peitoral', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Peitoral Maior (Fibras Clavicilares)', secondaryMuscles: 'Deltoide Anterior' },
  { id: 'pe09', name: 'Crucifixo Declinado com Halteres', group: 'Peitoral', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Peitoral Maior (Fibras Esternocostais)', secondaryMuscles: 'Deltoide Anterior' },
  { id: 'pe10', name: 'Crossover no Cabo (Polia Alta)', group: 'Peitoral', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Peitoral Maior (Foco Porção Inferior)', secondaryMuscles: 'Deltoide Anterior' },
  { id: 'pe11', name: 'Crossover no Cabo (Polia Média)', group: 'Peitoral', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Peitoral Maior (Tensão Contínua Esternal)', secondaryMuscles: 'Deltoide Anterior' },
  { id: 'pe12', name: 'Crossover no Cabo (Polia Baixa)', group: 'Peitoral', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Peitoral Maior (Foco Feixe Clavicular)', secondaryMuscles: 'Deltoide Anterior' },
  { id: 'pe13', name: 'Peck Deck / Voador (Máquina)', group: 'Peitoral', mechanics: 'Isolador', equipment: 'Máquina', primaryMuscle: 'Peitoral Maior (Pico de Contração Medial)', secondaryMuscles: 'Deltoide Anterior' },
  { id: 'pe14', name: 'Supino Vertical na Máquina Articulada', group: 'Peitoral', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Peitoral Maior (Trajetória Convergente)', secondaryMuscles: 'Tríceps Braquial, Deltoide' },
  { id: 'pe15', name: 'Supino Inclinado na Máquina Convergente', group: 'Peitoral', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Peitoral Maior (Porção Superior)', secondaryMuscles: 'Tríceps, Deltoide Anterior' },
  { id: 'pe16', name: 'Supino no Smith (Guia Reto)', group: 'Peitoral', mechanics: 'Composto', equipment: 'Smith', primaryMuscle: 'Peitoral Maior', secondaryMuscles: 'Tríceps, Deltoide' },
  { id: 'pe17', name: 'Supino no Smith Inclinado', group: 'Peitoral', mechanics: 'Composto', equipment: 'Smith', primaryMuscle: 'Peitoral Maior (Superior)', secondaryMuscles: 'Tríceps, Deltoide Anterior' },
  { id: 'pe18', name: 'Flexão de Braço no Solo (Push-up)', group: 'Peitoral', mechanics: 'Composto', equipment: 'Peso Corporal', primaryMuscle: 'Peitoral Maior', secondaryMuscles: 'Tríceps, Core (estabilização)' },
  { id: 'pe19', name: 'Mergulho em Paralelas (Foco Peitoral)', group: 'Peitoral', mechanics: 'Composto', equipment: 'Peso Corporal', primaryMuscle: 'Peitoral Maior (Tronco inclinado à frente)', secondaryMuscles: 'Tríceps Braquial, Deltoide Anterior' },
  { id: 'pe20', name: 'Pullover com Halter', group: 'Peitoral', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Peitoral Maior & Serrátil Anterior', secondaryMuscles: 'Latíssimo do Dorso, Tríceps Longo' },

  // ── DORSAL / COSTAS (BARRAS, HALTERES, CABOS, MÁQUINAS, LIVRES) ──
  { id: 'do01', name: 'Barra Fixa Pronada (Pull-up)', group: 'Dorsal', mechanics: 'Composto', equipment: 'Peso Corporal', primaryMuscle: 'Latíssimo do Dorso (Largura Dorsal)', secondaryMuscles: 'Romboides, Bíceps, Trapézio Inferior' },
  { id: 'do02', name: 'Barra Fixa Supinada (Chin-up)', group: 'Dorsal', mechanics: 'Composto', equipment: 'Peso Corporal', primaryMuscle: 'Latíssimo do Dorso & Bíceps Braquial', secondaryMuscles: 'Romboides, Braquial' },
  { id: 'do03', name: 'Barra Fixa com Pegada Neutra', group: 'Dorsal', mechanics: 'Composto', equipment: 'Peso Corporal', primaryMuscle: 'Latíssimo do Dorso & Braquiorradial', secondaryMuscles: 'Bíceps, Romboides' },
  { id: 'do04', name: 'Puxada Frontal Aberta na Polia', group: 'Dorsal', mechanics: 'Composto', equipment: 'Cabo', primaryMuscle: 'Latíssimo do Dorso (Fibras Superiores)', secondaryMuscles: 'Bíceps Braquial, Romboides' },
  { id: 'do05', name: 'Puxada Frontal com Triângulo (Fechada)', group: 'Dorsal', mechanics: 'Composto', equipment: 'Cabo', primaryMuscle: 'Latíssimo do Dorso & Redondo Maior', secondaryMuscles: 'Bíceps, Braquial' },
  { id: 'do06', name: 'Puxada Supinada na Polia', group: 'Dorsal', mechanics: 'Composto', equipment: 'Cabo', primaryMuscle: 'Latíssimo do Dorso (Feixe Inferior)', secondaryMuscles: 'Bíceps Braquial, Braquial' },
  { id: 'do07', name: 'Pulldown / Puxada com Braços Retos (Cabo)', group: 'Dorsal', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Latíssimo do Dorso (Isolamento)', secondaryMuscles: 'Redondo Maior, Tríceps Longo' },
  { id: 'do08', name: 'Remada Curvada com Barra (Pronada)', group: 'Dorsal', mechanics: 'Composto', equipment: 'Barra', primaryMuscle: 'Latíssimo do Dorso & Romboides (Espessura)', secondaryMuscles: 'Trapézio Médio/Inf, Bíceps, Eretores' },
  { id: 'do09', name: 'Remada Curvada com Barra (Supinada/Yates)', group: 'Dorsal', mechanics: 'Composto', equipment: 'Barra', primaryMuscle: 'Latíssimo do Dorso (Feixe Inferior)', secondaryMuscles: 'Bíceps Braquial, Romboides' },
  { id: 'do10', name: 'Remada Cavalinho (Barra T)', group: 'Dorsal', mechanics: 'Composto', equipment: 'Barra', primaryMuscle: 'Romboides, Latíssimo & Trapézio Médio', secondaryMuscles: 'Bíceps, Eretores da Espinha' },
  { id: 'do11', name: 'Remada Unilateral com Halter (Serrote)', group: 'Dorsal', mechanics: 'Composto', equipment: 'Halteres', primaryMuscle: 'Latíssimo do Dorso (Unilateral)', secondaryMuscles: 'Romboides, Bíceps, Redondo Maior' },
  { id: 'do12', name: 'Remada Baixa no Cabo (Triângulo)', group: 'Dorsal', mechanics: 'Composto', equipment: 'Cabo', primaryMuscle: 'Romboides & Latíssimo do Dorso', secondaryMuscles: 'Bíceps Braquial, Trapézio' },
  { id: 'do13', name: 'Remada Baixa com Barra Reta / Pegada Aberta', group: 'Dorsal', mechanics: 'Composto', equipment: 'Cabo', primaryMuscle: 'Trapézio Médio, Romboides & Deltoide Posterior', secondaryMuscles: 'Latíssimo, Bíceps' },
  { id: 'do14', name: 'Remada Articulada na Máquina (Peito Apoiado)', group: 'Dorsal', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Latíssimo do Dorso & Romboides', secondaryMuscles: 'Bíceps, Trapézio' },
  { id: 'do15', name: 'Puxada Vertical na Máquina Articulada', group: 'Dorsal', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Latíssimo do Dorso', secondaryMuscles: 'Bíceps Braquial' },
  { id: 'do16', name: 'Levantamento Terra Convencional (Deadlift)', group: 'Dorsal', mechanics: 'Composto', equipment: 'Barra', primaryMuscle: 'Eretores da Espinha, Glúteos & Isquiotibiais', secondaryMuscles: 'Latíssimo, Trapézio, Quadríceps, Core' },
  { id: 'do17', name: 'Hiperextensão Lombar (Banco 45°)', group: 'Dorsal', mechanics: 'Isolador', equipment: 'Peso Corporal', primaryMuscle: 'Eretores da Espinha (Lombar)', secondaryMuscles: 'Glúteo Máximo, Isquiotibiais' },

  // ── PERNAS & GLÚTEOS (QUADRÍCEPS, ISQUIOTIBIAIS, PANTURRILHA, GLÚTEO) ──
  { id: 'lg01', name: 'Agachamento Livre com Barra (Back Squat)', group: 'Pernas', mechanics: 'Composto', equipment: 'Barra', primaryMuscle: 'Quadríceps (Vasto Lat., Med., Reto Fem.)', secondaryMuscles: 'Glúteo Máximo, Isquiotibiais, Core' },
  { id: 'lg02', name: 'Agachamento Frontal com Barra (Front Squat)', group: 'Pernas', mechanics: 'Composto', equipment: 'Barra', primaryMuscle: 'Quadríceps (Foco Reto Femoral)', secondaryMuscles: 'Glúteos, Core Abdominal' },
  { id: 'lg03', name: 'Agachamento Hack (Máquina)', group: 'Pernas', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Quadríceps (Isolamento de Carga)', secondaryMuscles: 'Glúteo Máximo' },
  { id: 'lg04', name: 'Leg Press 45°', group: 'Pernas', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Quadríceps & Glúteos', secondaryMuscles: 'Isquiotibiais, Adutores' },
  { id: 'lg05', name: 'Leg Press Horizontal', group: 'Pernas', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Quadríceps', secondaryMuscles: 'Glúteos' },
  { id: 'lg06', name: 'Cadeira Extensora', group: 'Pernas', mechanics: 'Isolador', equipment: 'Máquina', primaryMuscle: 'Quadríceps (Reto Femoral & Vastos)', secondaryMuscles: '—' },
  { id: 'lg07', name: 'Agachamento Búlgaro com Halteres', group: 'Pernas', mechanics: 'Composto', equipment: 'Halteres', primaryMuscle: 'Glúteo Máximo & Quadríceps (Unilateral)', secondaryMuscles: 'Isquiotibiais, Adutores' },
  { id: 'lg08', name: 'Avanço / Passada com Halteres ou Barra', group: 'Pernas', mechanics: 'Composto', equipment: 'Halteres', primaryMuscle: 'Quadríceps & Glúteos', secondaryMuscles: 'Isquiotibiais, Panturrilhas' },
  { id: 'lg09', name: 'Agachamento Sissy (Sissy Squat)', group: 'Pernas', mechanics: 'Isolador', equipment: 'Peso Corporal', primaryMuscle: 'Quadríceps (Alongamento Extremo Reto Fem.)', secondaryMuscles: 'Core' },
  { id: 'lg10', name: 'Stiff com Barra (Terra Romeno)', group: 'Pernas', mechanics: 'Composto', equipment: 'Barra', primaryMuscle: 'Isquiotibiais (Bíceps Femoral, Semitendíneo)', secondaryMuscles: 'Glúteo Máximo, Eretores Lombares' },
  { id: 'lg11', name: 'Stiff com Halteres', group: 'Pernas', mechanics: 'Composto', equipment: 'Halteres', primaryMuscle: 'Isquiotibiais & Glúteo', secondaryMuscles: 'Eretores da Espinha' },
  { id: 'lg12', name: 'Mesa Flexora Deitada', group: 'Pernas', mechanics: 'Isolador', equipment: 'Máquina', primaryMuscle: 'Isquiotibiais (Bíceps Femoral)', secondaryMuscles: 'Gastrocnêmio' },
  { id: 'lg13', name: 'Cadeira Flexora Sentada', group: 'Pernas', mechanics: 'Isolador', equipment: 'Máquina', primaryMuscle: 'Isquiotibiais (Maior Alongamento Pélvico)', secondaryMuscles: 'Gastrocnêmio' },
  { id: 'lg14', name: 'Flexora Vertical Unilateral', group: 'Pernas', mechanics: 'Isolador', equipment: 'Máquina', primaryMuscle: 'Isquiotibiais (Equilíbrio Muscular)', secondaryMuscles: '—' },
  { id: 'lg15', name: 'Elevação Pélvica com Barra (Hip Thrust)', group: 'Pernas', mechanics: 'Composto', equipment: 'Barra', primaryMuscle: 'Glúteo Máximo (Pico de Contração)', secondaryMuscles: 'Isquiotibiais, Adutores' },
  { id: 'lg16', name: 'Elevação Pélvica na Máquina', group: 'Pernas', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Glúteo Máximo', secondaryMuscles: 'Isquiotibiais' },
  { id: 'lg17', name: 'Cadeira Abdutora', group: 'Pernas', mechanics: 'Isolador', equipment: 'Máquina', primaryMuscle: 'Glúteo Médio & Glúteo Mínimo', secondaryMuscles: 'Tensor da Fáscia Lata' },
  { id: 'lg18', name: 'Cadeira Adutora', group: 'Pernas', mechanics: 'Isolador', equipment: 'Máquina', primaryMuscle: 'Adutores da Coxa (Magno, Longo, Breve)', secondaryMuscles: 'Grácil' },
  { id: 'lg19', name: 'Glúteo no Cabo (Coiçe / Extensão)', group: 'Pernas', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Glúteo Máximo (Isolado)', secondaryMuscles: 'Isquiotibiais' },
  { id: 'lg20', name: 'Panturrilha em Pé na Máquina', group: 'Pernas', mechanics: 'Isolador', equipment: 'Máquina', primaryMuscle: 'Gastrocnêmio (Cabeça Medial e Lateral)', secondaryMuscles: 'Sóleo' },
  { id: 'lg21', name: 'Panturrilha Sentado (Gêmeos / Sóleo)', group: 'Pernas', mechanics: 'Isolador', equipment: 'Máquina', primaryMuscle: 'Sóleo (Trabalho com Joelho Flexionado)', secondaryMuscles: 'Gastrocnêmio profundo' },
  { id: 'lg22', name: 'Panturrilha no Leg Press 45°', group: 'Pernas', mechanics: 'Isolador', equipment: 'Máquina', primaryMuscle: 'Gastrocnêmio & Sóleo', secondaryMuscles: 'Tibial' },

  // ── OMBROS & TRAPÉZIO ──
  { id: 'sh01', name: 'Desenvolvimento Militar em Pé (Overhead)', group: 'Ombros', mechanics: 'Composto', equipment: 'Barra', primaryMuscle: 'Deltoide Anterior & Medial', secondaryMuscles: 'Tríceps, Trapézio Superior, Core' },
  { id: 'sh02', name: 'Desenvolvimento Sentado com Halteres', group: 'Ombros', mechanics: 'Composto', equipment: 'Halteres', primaryMuscle: 'Deltoide Anterior & Medial', secondaryMuscles: 'Tríceps Braquial, Trapézio' },
  { id: 'sh03', name: 'Desenvolvimento Arnold (Arnold Press)', group: 'Ombros', mechanics: 'Composto', equipment: 'Halteres', primaryMuscle: 'Deltoide Anterior, Medial & Rotação', secondaryMuscles: 'Tríceps Braquial' },
  { id: 'sh04', name: 'Desenvolvimento na Máquina Articulada', group: 'Ombros', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Deltoide Anterior & Medial', secondaryMuscles: 'Tríceps' },
  { id: 'sh05', name: 'Desenvolvimento no Smith', group: 'Ombros', mechanics: 'Composto', equipment: 'Smith', primaryMuscle: 'Deltoide Anterior', secondaryMuscles: 'Tríceps, Trapézio' },
  { id: 'sh06', name: 'Elevação Lateral com Halteres', group: 'Ombros', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Deltoide Medial (Feixe Acromial / Largura)', secondaryMuscles: 'Deltoide Anterior, Trapézio Sup.' },
  { id: 'sh07', name: 'Elevação Lateral na Polia Baixa (Cabo)', group: 'Ombros', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Deltoide Medial (Tensão Contínua)', secondaryMuscles: 'Supraespinhal' },
  { id: 'sh08', name: 'Elevação Lateral na Máquina', group: 'Ombros', mechanics: 'Isolador', equipment: 'Máquina', primaryMuscle: 'Deltoide Medial', secondaryMuscles: 'Trapézio' },
  { id: 'sh09', name: 'Elevação Lateral Inclinada no Banco 45°', group: 'Ombros', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Deltoide Medial (Maior Alongamento)', secondaryMuscles: 'Supraespinhal' },
  { id: 'sh10', name: 'Elevação Frontal com Halteres', group: 'Ombros', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Deltoide Anterior (Feixe Clavicular)', secondaryMuscles: 'Peitoral Superior' },
  { id: 'sh11', name: 'Elevação Frontal com Barra', group: 'Ombros', mechanics: 'Isolador', equipment: 'Barra', primaryMuscle: 'Deltoide Anterior', secondaryMuscles: 'Peitoral Superior' },
  { id: 'sh12', name: 'Elevação Frontal na Polia com Corda', group: 'Ombros', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Deltoide Anterior', secondaryMuscles: 'Peitoral Clavicular' },
  { id: 'sh13', name: 'Crucifixo Inverso com Halteres', group: 'Ombros', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Deltoide Posterior', secondaryMuscles: 'Romboides, Trapézio Médio' },
  { id: 'sh14', name: 'Crucifixo Inverso no Peck Deck (Máquina)', group: 'Ombros', mechanics: 'Isolador', equipment: 'Máquina', primaryMuscle: 'Deltoide Posterior', secondaryMuscles: 'Romboides, Trapézio' },
  { id: 'sh15', name: 'Face Pull na Polia com Corda', group: 'Ombros', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Deltoide Posterior & Manguito Rotador', secondaryMuscles: 'Trapézio Médio/Inf, Romboides' },
  { id: 'sh16', name: 'Remada Alta com Barra (Upright Row)', group: 'Ombros', mechanics: 'Composto', equipment: 'Barra', primaryMuscle: 'Deltoide Medial & Trapézio Superior', secondaryMuscles: 'Bíceps, Braquial' },
  { id: 'sh17', name: 'Remada Alta na Polia Baixa', group: 'Ombros', mechanics: 'Composto', equipment: 'Cabo', primaryMuscle: 'Deltoide Medial & Trapézio', secondaryMuscles: 'Braquial, Bíceps' },
  { id: 'sh18', name: 'Encolhimento com Barra (Shrug)', group: 'Ombros', mechanics: 'Isolador', equipment: 'Barra', primaryMuscle: 'Trapézio Superior', secondaryMuscles: 'Elevador da Escápula' },
  { id: 'sh19', name: 'Encolhimento com Halteres', group: 'Ombros', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Trapézio Superior (Foco em Contração)', secondaryMuscles: 'Elevador da Escápula' },
  { id: 'sh20', name: 'Encolhimento no Smith por Trás', group: 'Ombros', mechanics: 'Isolador', equipment: 'Smith', primaryMuscle: 'Trapézio Superior & Médio', secondaryMuscles: 'Romboides' },

  // ── BÍCEPS & ANTEBRAÇO ──
  { id: 'bi01', name: 'Rosca Direta com Barra Reta', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Barra', primaryMuscle: 'Bíceps Braquial (Cabeça Longa e Curta)', secondaryMuscles: 'Braquial, Braquiorradial' },
  { id: 'bi02', name: 'Rosca Direta com Barra W (EZ Bar)', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Barra', primaryMuscle: 'Bíceps Braquial (Menor estresse nos punhos)', secondaryMuscles: 'Braquial' },
  { id: 'bi03', name: 'Rosca Alternada com Halteres (com Supinação)', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Bíceps Braquial (Pico de Supinação)', secondaryMuscles: 'Braquial Anterior' },
  { id: 'bi04', name: 'Rosca Martelo com Halteres', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Braquiorradial & Braquial Anterior', secondaryMuscles: 'Bíceps Braquial (neutro)' },
  { id: 'bi05', name: 'Rosca Martelo na Polia com Corda', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Braquiorradial & Braquial', secondaryMuscles: 'Bíceps Braquial' },
  { id: 'bi06', name: 'Rosca Scott com Barra W (Banco Scott)', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Barra', primaryMuscle: 'Bíceps Braquial (Foco Cabeça Curta/Braquial)', secondaryMuscles: 'Braquial' },
  { id: 'bi07', name: 'Rosca Scott Unilateral com Halter', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Bíceps Braquial (Isolamento Escapular)', secondaryMuscles: 'Braquial' },
  { id: 'bi08', name: 'Rosca Scott na Máquina', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Máquina', primaryMuscle: 'Bíceps Braquial (Tensão Contínua)', secondaryMuscles: 'Braquial' },
  { id: 'bi09', name: 'Rosca Inclinada no Banco 45° (Halteres)', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Bíceps Braquial (Cabeça Longa / Alongamento)', secondaryMuscles: 'Braquial' },
  { id: 'bi10', name: 'Rosca Concentrada com Halter (Arnold)', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Bíceps Braquial (Pico de Contração Máximo)', secondaryMuscles: 'Braquial' },
  { id: 'bi11', name: 'Rosca na Polia Baixa (Cabo / Barra Reta)', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Bíceps Braquial (Tensão em toda ADM)', secondaryMuscles: 'Braquial' },
  { id: 'bi12', name: 'Rosca Spider no Banco Inclinado', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Bíceps Braquial (Cabeça Curta)', secondaryMuscles: 'Braquial' },
  { id: 'bi13', name: 'Rosca Hércules / Dupla Polia Alta', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Bíceps Braquial (Pico Duplo Bíceps)', secondaryMuscles: 'Braquial' },
  { id: 'bi14', name: 'Rosca 21 com Barra', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Barra', primaryMuscle: 'Bíceps Braquial (Exaustão Metabólica)', secondaryMuscles: 'Braquial, Braquiorradial' },
  { id: 'bi15', name: 'Rosca Inversa com Barra (Pronada)', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Barra', primaryMuscle: 'Braquiorradial & Extensores de Punho', secondaryMuscles: 'Braquial' },
  { id: 'bi16', name: 'Rosca Punho com Barra (Flexão de Punho)', group: 'Bíceps', mechanics: 'Isolador', equipment: 'Barra', primaryMuscle: 'Flexores do Antebraço', secondaryMuscles: 'Pronador Redondo' },

  // ── TRÍCEPS ──
  { id: 'tr01', name: 'Tríceps na Polia com Barra Reta (Pushdown)', group: 'Tríceps', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Tríceps Braquial (Cabeça Lateral)', secondaryMuscles: 'Ancôneo' },
  { id: 'tr02', name: 'Tríceps na Polia com Corda', group: 'Tríceps', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Tríceps Braquial (Cabeça Lateral & Medial)', secondaryMuscles: 'Ancôneo' },
  { id: 'tr03', name: 'Tríceps na Polia Invertido (Supinado)', group: 'Tríceps', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Tríceps Braquial (Cabeça Medial)', secondaryMuscles: 'Ancôneo' },
  { id: 'tr04', name: 'Tríceps Testa com Barra W (Skull Crusher)', group: 'Tríceps', mechanics: 'Isolador', equipment: 'Barra', primaryMuscle: 'Tríceps Braquial (Cabeça Longa & Lateral)', secondaryMuscles: 'Ancôneo' },
  { id: 'tr05', name: 'Tríceps Testa com Halteres', group: 'Tríceps', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Tríceps Braquial (Unilateral)', secondaryMuscles: 'Ancôneo' },
  { id: 'tr06', name: 'Tríceps Francês com Halter (Em Pé/Sentado)', group: 'Tríceps', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Tríceps Braquial (Cabeça Longa / Alongamento)', secondaryMuscles: 'Cabeça Lateral' },
  { id: 'tr07', name: 'Tríceps Francês na Polia com Corda', group: 'Tríceps', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Tríceps Braquial (Cabeça Longa)', secondaryMuscles: 'Ancôneo' },
  { id: 'tr08', name: 'Supino Fechado com Barra (Close-Grip)', group: 'Tríceps', mechanics: 'Composto', equipment: 'Barra', primaryMuscle: 'Tríceps Braquial (Todas as cabeças)', secondaryMuscles: 'Peitoral Maior, Deltoide Anterior' },
  { id: 'tr09', name: 'Mergulho em Paralelas (Foco Tríceps)', group: 'Tríceps', mechanics: 'Composto', equipment: 'Peso Corporal', primaryMuscle: 'Tríceps Braquial (Tronco reto)', secondaryMuscles: 'Peitoral Anterior, Deltoide' },
  { id: 'tr10', name: 'Mergulho no Banco (Bench Dips)', group: 'Tríceps', mechanics: 'Composto', equipment: 'Peso Corporal', primaryMuscle: 'Tríceps Braquial', secondaryMuscles: 'Deltoide Anterior' },
  { id: 'tr11', name: 'Tríceps Coice com Halter (Kickback)', group: 'Tríceps', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Tríceps Braquial (Pico de Extensão Final)', secondaryMuscles: 'Ancôneo' },
  { id: 'tr12', name: 'Tríceps Coice no Cabo (Unilateral)', group: 'Tríceps', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Tríceps Braquial (Tensão Contínua)', secondaryMuscles: 'Ancôneo' },
  { id: 'tr13', name: 'Tríceps Máquina Articulada (Dip Machine)', group: 'Tríceps', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Tríceps Braquial', secondaryMuscles: 'Deltoide Anterior' },

  // ── ABDÔMEN & CORE ──
  { id: 'ab01', name: 'Abdominal Crunch no Solo / Banco Declinado', group: 'Abdômen', mechanics: 'Isolador', equipment: 'Peso Corporal', primaryMuscle: 'Reto Abdominal (Porção Superior)', secondaryMuscles: 'Oblíquos' },
  { id: 'ab02', name: 'Abdominal na Polia Alta com Corda (Cable Crunch)', group: 'Abdômen', mechanics: 'Isolador', equipment: 'Cabo', primaryMuscle: 'Reto Abdominal (Carga Progressiva)', secondaryMuscles: 'Oblíquos' },
  { id: 'ab03', name: 'Elevação de Pernas na Barra Fixa (Hanging Leg Raise)', group: 'Abdômen', mechanics: 'Composto', equipment: 'Peso Corporal', primaryMuscle: 'Reto Abdominal (Infra) & Iliopsoas', secondaryMuscles: 'Oblíquos, Antebraços' },
  { id: 'ab04', name: 'Elevação de Pernas na Paralela (Capitão)', group: 'Abdômen', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Reto Abdominal (Infra)', secondaryMuscles: 'Flexores de Quadril' },
  { id: 'ab05', name: 'Abdominal Rollout (Roda Abdominal)', group: 'Abdômen', mechanics: 'Composto', equipment: 'Acessório', primaryMuscle: 'Core Global, Reto Abdominal & Transverso', secondaryMuscles: 'Dorsal, Serrátil' },
  { id: 'ab06', name: 'Prancha Isométrica no Solo (Plank)', group: 'Abdômen', mechanics: 'Isolador', equipment: 'Peso Corporal', primaryMuscle: 'Transverso do Abdômen & Reto Abdominal', secondaryMuscles: 'Glúteos, Ombros' },
  { id: 'ab07', name: 'Russian Twist com Halter ou Anilha', group: 'Abdômen', mechanics: 'Isolador', equipment: 'Halteres', primaryMuscle: 'Oblíquos Interno e Externo', secondaryMuscles: 'Reto Abdominal' },
  { id: 'ab08', name: 'Abdominal na Máquina (Machine Crunch)', group: 'Abdômen', mechanics: 'Isolador', equipment: 'Máquina', primaryMuscle: 'Reto Abdominal', secondaryMuscles: 'Oblíquos' },

  // ── CARDIO & ERGÔMETROS (HYROX, CONCORRENTE, INTERVALOS) ──
  { id: 'hy01', name: 'SkiErg Concept2 (Intervalos de Potência)', group: 'Cardio & Ergômetros', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Dorsal, Tríceps & Core', secondaryMuscles: 'Ombros, Glúteos' },
  { id: 'hy02', name: 'Remo Concept2 RowErg (Capacidade Aeróbica)', group: 'Cardio & Ergômetros', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Pernas, Dorsal & Bíceps', secondaryMuscles: 'Core, Trapézio' },
  { id: 'hy03', name: 'AirBike / Echo Bike / CycleAir', group: 'Cardio & Ergômetros', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Quadríceps & Glúteos', secondaryMuscles: 'Peito, Costas, Braços' },
  { id: 'hy04', name: 'Tiros de Velocidade na Esteira (Sprints)', group: 'Cardio & Ergômetros', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Membros Inferiores & Potência Anaeróbia', secondaryMuscles: 'Core, Panturrilhas' },
  { id: 'hy05', name: 'Corrida Contínua na Esteira (Ritmo Z3/Z4)', group: 'Cardio & Ergômetros', mechanics: 'Composto', equipment: 'Máquina', primaryMuscle: 'Endurance Cardiovascular & Muscular', secondaryMuscles: 'Panturrilhas, Quadríceps' },

  // ── FUNCIONAL / HYROX & PESO LIVRE (ESTAÇÕES OFICIAIS & CALISTENIA) ──
  { id: 'hy06', name: 'Sled Push (Empurrar Trenó com Carga)', group: 'Funcional / HYROX', mechanics: 'Composto', equipment: 'Acessório', primaryMuscle: 'Quadríceps, Glúteos & Panturrilhas', secondaryMuscles: 'Core, Ombros' },
  { id: 'hy07', name: 'Sled Pull (Puxar Trenó com Corda)', group: 'Funcional / HYROX', mechanics: 'Composto', equipment: 'Acessório', primaryMuscle: 'Dorsal, Bíceps & Isquiotibiais', secondaryMuscles: 'Antebraço, Core' },
  { id: 'hy08', name: 'Burpee Broad Jumps (Salto em Extensão)', group: 'Funcional / HYROX', mechanics: 'Composto', equipment: 'Peso Corporal', primaryMuscle: 'Potência de Pernas & Core', secondaryMuscles: 'Peitoral, Tríceps' },
  { id: 'hy09', name: 'Sandbag Walking Lunges (Passada com Saco)', group: 'Funcional / HYROX', mechanics: 'Composto', equipment: 'Acessório', primaryMuscle: 'Quadríceps & Glúteo Máximo', secondaryMuscles: 'Core, Trapézio' },
  { id: 'hy10', name: 'Farmers Carry com Halteres / Kettlebells', group: 'Funcional / HYROX', mechanics: 'Composto', equipment: 'Halteres', primaryMuscle: 'Trapézio, Antebraços & Core', secondaryMuscles: 'Glúteos, Panturrilhas' },
  { id: 'hy11', name: 'Wall Balls com Medicine Ball (6/9kg)', group: 'Funcional / HYROX', mechanics: 'Composto', equipment: 'Acessório', primaryMuscle: 'Quadríceps, Glúteos & Deltoides', secondaryMuscles: 'Tríceps, Core' },
  { id: 'hy12', name: 'Thrusters com Barra (Agachamento + Press)', group: 'Funcional / HYROX', mechanics: 'Composto', equipment: 'Barra', primaryMuscle: 'Corpo Inteiro (Pernas + Ombros)', secondaryMuscles: 'Tríceps, Core' },
  { id: 'hy13', name: 'Box Jump na Caixa (60cm)', group: 'Funcional / HYROX', mechanics: 'Composto', equipment: 'Acessório', primaryMuscle: 'Potência de Extensão de Quadril', secondaryMuscles: 'Panturrilhas, Core' },
  { id: 'hy14', name: 'Kettlebell Swing Americano', group: 'Funcional / HYROX', mechanics: 'Composto', equipment: 'Acessório', primaryMuscle: 'Glúteos & Isquiotibiais (Hip Hinge)', secondaryMuscles: 'Deltóides, Core' },
];

const MUSCLE_GROUPS = [
  'Todos',
  'Cardio & Ergômetros',
  'Funcional / HYROX',
  'Peitoral',
  'Dorsal',
  'Pernas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Abdômen'
];

const MECHANICS_COLOR: Record<string, string> = {
  'Composto': 'text-blue-400 bg-blue-500/10 border border-blue-500/30',
  'Isolador': 'text-violet-400 bg-violet-500/10 border border-violet-500/30',
};

// ─────────────────────────────────────────────────────────────────────────────
// PRESETS DE DIVISÕES DE TREINO (HÍBRIDAS & TRADICIONAIS)
// ─────────────────────────────────────────────────────────────────────────────
interface SplitDefinition {
  id: string;
  name: string;
  category: 'Híbrida & Racing' | 'Musculação Tradicional';
  daysCount: number;
  description: string;
  badge: string;
  icon: string;
  routines: WorkoutRoutine[];
}

const TRAINING_SPLITS: Record<string, SplitDefinition> = {
  HYROX: {
    id: 'HYROX',
    name: 'HYROX / Fitness Racing',
    category: 'Híbrida & Racing',
    daysCount: 3,
    description: 'Ergômetros (SkiErg, Remo, AirBike), estações oficiais (trenó, lunges, wall balls) e esteira.',
    badge: '★ Racing',
    icon: '⚡🏃🏋️',
    routines: [
      {
        id: 'A',
        name: 'Treino A — Ergômetros & Potência Aeróbica (HYROX)',
        exercises: [
          { exerciseId: 'hy01', name: 'SkiErg Concept2 (Intervalos de Potência)', sets: 5, reps: '500m', rpe: 8.5, rest: 90 },
          { exerciseId: 'hy02', name: 'Remo Concept2 RowErg (Capacidade Aeróbica)', sets: 4, reps: '750m', rpe: 8.0, rest: 90 },
          { exerciseId: 'hy03', name: 'AirBike / Echo Bike / CycleAir', sets: 4, reps: '1 min', rpe: 9.0, rest: 120 },
          { exerciseId: 'hy04', name: 'Tiros de Velocidade na Esteira (Sprints)', sets: 5, reps: '400m', rpe: 8.5, rest: 60 },
          { exerciseId: 'ab06', name: 'Prancha Isométrica no Solo (Plank)', sets: 4, reps: '45s', rpe: 8.0, rest: 45 },
        ],
      },
      {
        id: 'B',
        name: 'Treino B — Força Funcional & Estações HYROX',
        exercises: [
          { exerciseId: 'hy06', name: 'Sled Push (Empurrar Trenó com Carga)', sets: 4, reps: '20m', rpe: 9.0, rest: 120 },
          { exerciseId: 'hy07', name: 'Sled Pull (Puxar Trenó com Corda)', sets: 4, reps: '20m', rpe: 8.5, rest: 120 },
          { exerciseId: 'hy08', name: 'Burpee Broad Jumps (Salto em Extensão)', sets: 4, reps: '15 reps', rpe: 8.5, rest: 90 },
          { exerciseId: 'hy09', name: 'Sandbag Walking Lunges (Passada com Saco)', sets: 4, reps: '20 passos', rpe: 8.5, rest: 90 },
          { exerciseId: 'hy10', name: 'Farmers Carry com Halteres / Kettlebells', sets: 4, reps: '50m', rpe: 8.5, rest: 90 },
          { exerciseId: 'hy11', name: 'Wall Balls com Medicine Ball (6/9kg)', sets: 4, reps: '20 reps', rpe: 9.0, rest: 60 },
        ],
      },
      {
        id: 'C',
        name: 'Treino C — Concorrente & Simulação de Prova',
        exercises: [
          { exerciseId: 'hy05', name: 'Corrida Contínua na Esteira (Ritmo Z3/Z4)', sets: 1, reps: '1000m', rpe: 7.0, rest: 60 },
          { exerciseId: 'hy02', name: 'Remo Concept2 RowErg (Capacidade Aeróbica)', sets: 4, reps: '500m', rpe: 8.5, rest: 90 },
          { exerciseId: 'hy01', name: 'SkiErg Concept2 (Intervalos de Potência)', sets: 4, reps: '500m', rpe: 8.5, rest: 90 },
          { exerciseId: 'hy11', name: 'Wall Balls com Medicine Ball (6/9kg)', sets: 4, reps: '15 reps', rpe: 8.5, rest: 60 },
          { exerciseId: 'hy10', name: 'Farmers Carry com Halteres / Kettlebells', sets: 3, reps: '40m', rpe: 8.0, rest: 60 },
        ],
      },
    ],
  },
  CrossFit: {
    id: 'CrossFit',
    name: 'CrossFit / Metcon WOD',
    category: 'Híbrida & Racing',
    daysCount: 3,
    description: 'Levantamento de peso olímpico (LPO), ginástica funcional e metcon glicolítico.',
    badge: '★ Híbrida',
    icon: '🔥🏋️',
    routines: [
      {
        id: 'A',
        name: 'Treino A — Força Básica & LPO',
        exercises: [
          { exerciseId: 'do16', name: 'Levantamento Terra Convencional (Deadlift)', sets: 5, reps: '3-5', rpe: 8.5, rest: 150 },
          { exerciseId: 'lg02', name: 'Agachamento Frontal com Barra (Front Squat)', sets: 4, reps: '4-6', rpe: 8.5, rest: 120 },
          { exerciseId: 'sh01', name: 'Desenvolvimento Militar em Pé (Overhead)', sets: 4, reps: '5-6', rpe: 8.0, rest: 90 },
        ],
      },
      {
        id: 'B',
        name: 'Treino B — Metcon Glicolítico & Ginástica',
        exercises: [
          { exerciseId: 'do01', name: 'Barra Fixa Pronada (Pull-up)', sets: 4, reps: '6-8', rpe: 8.5, rest: 90 },
          { exerciseId: 'pe19', name: 'Mergulho em Paralelas (Foco Peitoral)', sets: 4, reps: '8-10', rpe: 8.0, rest: 90 },
          { exerciseId: 'hy12', name: 'Thrusters com Barra (Agachamento + Press)', sets: 4, reps: '12-15', rpe: 9.0, rest: 90 },
          { exerciseId: 'ab03', name: 'Elevação de Pernas na Barra Fixa (Hanging Leg Raise)', sets: 4, reps: '10-12', rpe: 8.0, rest: 60 },
        ],
      },
      {
        id: 'C',
        name: 'Treino C — Resistência Metabólica Mista (WOD)',
        exercises: [
          { exerciseId: 'hy14', name: 'Kettlebell Swing Americano', sets: 4, reps: '15-20', rpe: 8.0, rest: 60 },
          { exerciseId: 'hy13', name: 'Box Jump na Caixa (60cm)', sets: 4, reps: '12 reps', rpe: 8.0, rest: 60 },
          { exerciseId: 'hy02', name: 'Remo Concept2 RowErg (Capacidade Aeróbica)', sets: 4, reps: '20 cal', rpe: 9.0, rest: 60 },
        ],
      },
    ],
  },
  RunningStrength: {
    id: 'RunningStrength',
    name: 'Corrida + Musculação (Concorrente)',
    category: 'Híbrida & Racing',
    daysCount: 4,
    description: 'Periodização concorrente com esteira, força de membros inferiores e cadeia posterior.',
    badge: '★ Híbrida',
    icon: '🏃🏋️',
    routines: [
      {
        id: 'A',
        name: 'Treino A — Upper Força + Tiros na Esteira',
        exercises: [
          { exerciseId: 'pe01', name: 'Supino Reto com Barra', sets: 4, reps: '6-8', rpe: 8.0, rest: 120 },
          { exerciseId: 'do08', name: 'Remada Curvada com Barra (Pronada)', sets: 4, reps: '6-8', rpe: 8.0, rest: 90 },
          { exerciseId: 'sh01', name: 'Desenvolvimento Militar em Pé (Overhead)', sets: 3, reps: '8-10', rpe: 8.0, rest: 90 },
          { exerciseId: 'hy04', name: 'Tiros de Velocidade na Esteira (Sprints)', sets: 8, reps: '200m', rpe: 9.0, rest: 45 },
        ],
      },
      {
        id: 'B',
        name: 'Treino B — Lower Força & Cadeia Posterior',
        exercises: [
          { exerciseId: 'lg01', name: 'Agachamento Livre com Barra (Back Squat)', sets: 4, reps: '5-6', rpe: 8.0, rest: 150 },
          { exerciseId: 'lg10', name: 'Stiff com Barra (Terra Romeno)', sets: 4, reps: '6-8', rpe: 8.0, rest: 120 },
          { exerciseId: 'lg07', name: 'Agachamento Búlgaro com Halteres', sets: 3, reps: '8 cada perna', rpe: 8.0, rest: 90 },
          { exerciseId: 'lg20', name: 'Panturrilha em Pé na Máquina', sets: 4, reps: '10-12', rpe: 8.5, rest: 60 },
        ],
      },
      {
        id: 'C',
        name: 'Treino C — Corrida Contínua em Limiar (Tempo Run)',
        exercises: [
          { exerciseId: 'hy05', name: 'Corrida Contínua na Esteira (Ritmo Z3/Z4)', sets: 1, reps: '35 min', rpe: 7.5, rest: 0 },
          { exerciseId: 'ab05', name: 'Abdominal Rollout (Roda Abdominal)', sets: 3, reps: '10-12', rpe: 8.0, rest: 60 },
          { exerciseId: 'ab06', name: 'Prancha Isométrica no Solo (Plank)', sets: 3, reps: '45s', rpe: 8.0, rest: 45 },
        ],
      },
      {
        id: 'D',
        name: 'Treino D — Full Body Funcional & Core',
        exercises: [
          { exerciseId: 'do16', name: 'Levantamento Terra Convencional (Deadlift)', sets: 4, reps: '6 reps', rpe: 8.0, rest: 120 },
          { exerciseId: 'pe05', name: 'Supino Inclinado com Halteres', sets: 3, reps: '8-10', rpe: 8.0, rest: 90 },
          { exerciseId: 'do11', name: 'Remada Unilateral com Halter (Serrote)', sets: 3, reps: '10 reps', rpe: 8.0, rest: 60 },
          { exerciseId: 'lg08', name: 'Avanço / Passada com Halteres ou Barra', sets: 3, reps: '12 passos', rpe: 7.5, rest: 60 },
        ],
      },
    ],
  },
  HIIT_Forca: {
    id: 'HIIT_Forca',
    name: 'HIIT + Musculação',
    category: 'Híbrida & Racing',
    daysCount: 3,
    description: 'Blocos de musculação hipertrófica combinados com finalizadores na esteira, remo e bike.',
    badge: '★ Híbrida',
    icon: '⚡🏋️',
    routines: [
      {
        id: 'A',
        name: 'Treino A — Push & HIIT Esteira',
        exercises: [
          { exerciseId: 'pe01', name: 'Supino Reto com Barra', sets: 4, reps: '6-8', rpe: 8.0, rest: 120 },
          { exerciseId: 'pe05', name: 'Supino Inclinado com Halteres', sets: 3, reps: '8-10', rpe: 8.0, rest: 90 },
          { exerciseId: 'sh06', name: 'Elevação Lateral com Halteres', sets: 4, reps: '10-12', rpe: 8.5, rest: 45 },
          { exerciseId: 'tr01', name: 'Tríceps na Polia com Barra Reta (Pushdown)', sets: 3, reps: '10-12', rpe: 8.5, rest: 60 },
          { exerciseId: 'hy04', name: 'Tiros de Velocidade na Esteira (Sprints)', sets: 8, reps: '30s tiros', rpe: 9.0, rest: 30 },
        ],
      },
      {
        id: 'B',
        name: 'Treino B — Pull & HIIT Remo',
        exercises: [
          { exerciseId: 'do01', name: 'Barra Fixa Pronada (Pull-up)', sets: 4, reps: '6-8', rpe: 8.5, rest: 120 },
          { exerciseId: 'do08', name: 'Remada Curvada com Barra (Pronada)', sets: 4, reps: '6-8', rpe: 8.0, rest: 90 },
          { exerciseId: 'bi01', name: 'Rosca Direta com Barra Reta', sets: 3, reps: '8-10', rpe: 8.0, rest: 60 },
          { exerciseId: 'hy02', name: 'Remo Concept2 RowErg (Capacidade Aeróbica)', sets: 6, reps: '150m sprint', rpe: 9.0, rest: 45 },
        ],
      },
      {
        id: 'C',
        name: 'Treino C — Legs & HIIT AirBike',
        exercises: [
          { exerciseId: 'lg01', name: 'Agachamento Livre com Barra (Back Squat)', sets: 4, reps: '6-8', rpe: 8.5, rest: 150 },
          { exerciseId: 'lg04', name: 'Leg Press 45°', sets: 3, reps: '8-10', rpe: 8.0, rest: 90 },
          { exerciseId: 'lg10', name: 'Stiff com Barra (Terra Romeno)', sets: 4, reps: '6-8', rpe: 8.0, rest: 120 },
          { exerciseId: 'hy03', name: 'AirBike / Echo Bike / CycleAir', sets: 8, reps: '20s on / 10s off', rpe: 9.5, rest: 10 },
        ],
      },
    ],
  },
  PPL: {
    id: 'PPL',
    name: 'Push / Pull / Legs (PPL)',
    category: 'Musculação Tradicional',
    daysCount: 3,
    description: 'Divisão clássica de 3 a 6 dias separando empurrar, puxar e membros inferiores.',
    badge: 'Clássico',
    icon: '🏋️',
    routines: [
      {
        id: 'A',
        name: 'Treino A — Push (Empurrar)',
        exercises: [
          { exerciseId: 'pe01', name: 'Supino Reto com Barra', sets: 4, reps: '6-8', rpe: 8.5, rest: 120 },
          { exerciseId: 'pe05', name: 'Supino Inclinado com Halteres', sets: 4, reps: '8-10', rpe: 8.0, rest: 90 },
          { exerciseId: 'sh06', name: 'Elevação Lateral com Halteres', sets: 4, reps: '12-15', rpe: 8.0, rest: 60 },
          { exerciseId: 'tr01', name: 'Tríceps na Polia com Barra Reta (Pushdown)', sets: 3, reps: '10-12', rpe: 8.0, rest: 60 },
          { exerciseId: 'ab02', name: 'Abdominal na Polia Alta com Corda (Cable Crunch)', sets: 3, reps: '12-15', rpe: 8.0, rest: 60 },
        ],
      },
      {
        id: 'B',
        name: 'Treino B — Pull (Puxar)',
        exercises: [
          { exerciseId: 'do01', name: 'Barra Fixa Pronada (Pull-up)', sets: 4, reps: '6-8', rpe: 8.5, rest: 120 },
          { exerciseId: 'do08', name: 'Remada Curvada com Barra (Pronada)', sets: 4, reps: '6-8', rpe: 8.5, rest: 90 },
          { exerciseId: 'sh15', name: 'Face Pull na Polia com Corda', sets: 3, reps: '12-15', rpe: 8.0, rest: 45 },
          { exerciseId: 'bi01', name: 'Rosca Direta com Barra Reta', sets: 3, reps: '8-10', rpe: 8.0, rest: 60 },
          { exerciseId: 'ab03', name: 'Elevação de Pernas na Barra Fixa (Hanging Leg Raise)', sets: 3, reps: '12-15', rpe: 8.0, rest: 60 },
        ],
      },
      {
        id: 'C',
        name: 'Treino C — Legs (Pernas)',
        exercises: [
          { exerciseId: 'lg01', name: 'Agachamento Livre com Barra (Back Squat)', sets: 4, reps: '6-8', rpe: 8.5, rest: 150 },
          { exerciseId: 'lg10', name: 'Stiff com Barra (Terra Romeno)', sets: 4, reps: '6-8', rpe: 8.5, rest: 120 },
          { exerciseId: 'lg06', name: 'Cadeira Extensora', sets: 3, reps: '12-15', rpe: 8.0, rest: 60 },
          { exerciseId: 'lg13', name: 'Cadeira Flexora Sentada', sets: 3, reps: '10-12', rpe: 8.0, rest: 60 },
          { exerciseId: 'lg20', name: 'Panturrilha em Pé na Máquina', sets: 4, reps: '12-15', rpe: 8.5, rest: 60 },
        ],
      },
    ],
  },
  UpperLower: {
    id: 'UpperLower',
    name: 'Upper / Lower (4 Dias)',
    category: 'Musculação Tradicional',
    daysCount: 4,
    description: 'Divisão de tronco e membros inferiores para alta frequência e força mecânica.',
    badge: 'Alta Freq.',
    icon: '⚡',
    routines: [
      {
        id: 'A',
        name: 'Treino A — Upper Força',
        exercises: [
          { exerciseId: 'pe01', name: 'Supino Reto com Barra', sets: 4, reps: '5-8', rpe: 8.5, rest: 120 },
          { exerciseId: 'do01', name: 'Barra Fixa Pronada (Pull-up)', sets: 4, reps: '5-8', rpe: 8.5, rest: 120 },
          { exerciseId: 'sh01', name: 'Desenvolvimento Militar em Pé (Overhead)', sets: 3, reps: '6-8', rpe: 8.0, rest: 90 },
          { exerciseId: 'tr01', name: 'Tríceps na Polia com Barra Reta (Pushdown)', sets: 3, reps: '8-10', rpe: 8.0, rest: 60 },
        ],
      },
      {
        id: 'B',
        name: 'Treino B — Lower Força',
        exercises: [
          { exerciseId: 'lg01', name: 'Agachamento Livre com Barra (Back Squat)', sets: 4, reps: '6-8', rpe: 8.5, rest: 150 },
          { exerciseId: 'lg10', name: 'Stiff com Barra (Terra Romeno)', sets: 4, reps: '6-8', rpe: 8.5, rest: 120 },
          { exerciseId: 'lg04', name: 'Leg Press 45°', sets: 3, reps: '8-10', rpe: 8.0, rest: 90 },
          { exerciseId: 'lg20', name: 'Panturrilha em Pé na Máquina', sets: 4, reps: '10-12', rpe: 8.5, rest: 60 },
        ],
      },
      {
        id: 'C',
        name: 'Treino C — Upper Hipertrofia',
        exercises: [
          { exerciseId: 'pe05', name: 'Supino Inclinado com Halteres', sets: 4, reps: '8-10', rpe: 8.0, rest: 90 },
          { exerciseId: 'do04', name: 'Puxada Frontal Aberta na Polia', sets: 4, reps: '8-10', rpe: 8.0, rest: 90 },
          { exerciseId: 'sh06', name: 'Elevação Lateral com Halteres', sets: 4, reps: '12-15', rpe: 8.0, rest: 45 },
          { exerciseId: 'bi01', name: 'Rosca Direta com Barra Reta', sets: 3, reps: '10-12', rpe: 8.0, rest: 60 },
        ],
      },
      {
        id: 'D',
        name: 'Treino D — Lower Hipertrofia',
        exercises: [
          { exerciseId: 'lg03', name: 'Agachamento Hack (Máquina)', sets: 4, reps: '8-10', rpe: 8.0, rest: 90 },
          { exerciseId: 'lg06', name: 'Cadeira Extensora', sets: 3, reps: '12-15', rpe: 8.5, rest: 60 },
          { exerciseId: 'lg13', name: 'Cadeira Flexora Sentada', sets: 3, reps: '10-12', rpe: 8.5, rest: 60 },
          { exerciseId: 'lg15', name: 'Elevação Pélvica com Barra (Hip Thrust)', sets: 3, reps: '8-10', rpe: 8.5, rest: 90 },
        ],
      },
    ],
  },
  FullBody: {
    id: 'FullBody',
    name: 'Full Body (3 Dias)',
    category: 'Musculação Tradicional',
    daysCount: 3,
    description: 'Corpo inteiro com foco em multiarticulares e recuperação espaçada.',
    badge: '3 Dias',
    icon: '⚡',
    routines: [
      {
        id: 'A',
        name: 'Treino A — Full Body Squat & Push',
        exercises: [
          { exerciseId: 'lg01', name: 'Agachamento Livre com Barra (Back Squat)', sets: 4, reps: '6-8', rpe: 8.5, rest: 120 },
          { exerciseId: 'pe01', name: 'Supino Reto com Barra', sets: 4, reps: '6-8', rpe: 8.0, rest: 90 },
          { exerciseId: 'do08', name: 'Remada Curvada com Barra (Pronada)', sets: 4, reps: '6-8', rpe: 8.0, rest: 90 },
          { exerciseId: 'ab06', name: 'Prancha Isométrica no Solo (Plank)', sets: 3, reps: '45s', rpe: 8.0, rest: 45 },
        ],
      },
      {
        id: 'B',
        name: 'Treino B — Full Body Hinge & Pull',
        exercises: [
          { exerciseId: 'lg10', name: 'Stiff com Barra (Terra Romeno)', sets: 4, reps: '6-8', rpe: 8.5, rest: 120 },
          { exerciseId: 'do01', name: 'Barra Fixa Pronada (Pull-up)', sets: 4, reps: '6-8', rpe: 8.5, rest: 120 },
          { exerciseId: 'sh01', name: 'Desenvolvimento Militar em Pé (Overhead)', sets: 3, reps: '8-10', rpe: 8.0, rest: 90 },
          { exerciseId: 'ab03', name: 'Elevação de Pernas na Barra Fixa (Hanging Leg Raise)', sets: 3, reps: '12-15', rpe: 8.0, rest: 60 },
        ],
      },
      {
        id: 'C',
        name: 'Treino C — Full Body Hipertrofia',
        exercises: [
          { exerciseId: 'lg04', name: 'Leg Press 45°', sets: 4, reps: '8-10', rpe: 8.0, rest: 90 },
          { exerciseId: 'pe05', name: 'Supino Inclinado com Halteres', sets: 4, reps: '8-10', rpe: 8.0, rest: 90 },
          { exerciseId: 'do04', name: 'Puxada Frontal Aberta na Polia', sets: 4, reps: '8-10', rpe: 8.0, rest: 90 },
          { exerciseId: 'sh06', name: 'Elevação Lateral com Halteres', sets: 3, reps: '12-15', rpe: 8.0, rest: 45 },
        ],
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function PerformanceDashboard() {
  // ── Catálogo ──
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Todos');

  // ── Divisão de Treino Ativa & Anamnese ──
  const [selectedSplit, setSelectedSplit] = useState<string>('HYROX');
  const [patientAnamnese, setPatientAnamnese] = useState<PacienteAnamneseDTO | null>(null);
  const [isSyncingAnamnese, setIsSyncingAnamnese] = useState(false);

  // ── Plano de Treino ──
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutRoutine[]>(() => {
    return JSON.parse(JSON.stringify(TRAINING_SPLITS.HYROX.routines));
  });

  // ── Rotina selecionada para adicionar exercício ──
  const [targetRoutineId, setTargetRoutineId] = useState<string>('A');

  // ── Co-piloto Biomecânico ──
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiToast, setAiToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ── Sincronização Inicial com Anamnese ──
  useEffect(() => {
    async function carregarAnamneseInicial() {
      try {
        setIsSyncingAnamnese(true);
        const res = await getPatientAnamneseAction();
        if (res) {
          setPatientAnamnese(res);
          const mod = res.anamnese.modalidadeTreino;
          let splitSugerido = 'HYROX';
          if (mod === 'hyrox') splitSugerido = 'HYROX';
          else if (mod === 'crossfit') splitSugerido = 'CrossFit';
          else if (mod === 'running_musculacao') splitSugerido = 'RunningStrength';
          else if (mod === 'hiit_forca') splitSugerido = 'HIIT_Forca';
          else if (mod === 'funcional_misto') splitSugerido = 'CrossFit';
          else if (mod === 'musculacao') splitSugerido = 'PPL';
          else splitSugerido = 'HYROX';

          setSelectedSplit(splitSugerido);
          if (TRAINING_SPLITS[splitSugerido]) {
            const plan = JSON.parse(JSON.stringify(TRAINING_SPLITS[splitSugerido].routines));
            setWorkoutPlan(plan);
            setTargetRoutineId(plan[0]?.id || 'A');
          }
        }
      } catch (err) {
        console.warn('[Performance] Erro ao carregar anamnese:', err);
      } finally {
        setIsSyncingAnamnese(false);
      }
    }
    carregarAnamneseInicial();
  }, []);

  const handleSplitChange = (newSplit: string) => {
    setSelectedSplit(newSplit);
    if (TRAINING_SPLITS[newSplit]) {
      const plan = JSON.parse(JSON.stringify(TRAINING_SPLITS[newSplit].routines));
      setWorkoutPlan(plan);
      setTargetRoutineId(plan[0]?.id || 'A');
      setAiToast({
        type: 'success',
        message: `Divisão de treino alterada para "${TRAINING_SPLITS[newSplit].name}" (${plan.length} rotinas ativas).`,
      });
      setTimeout(() => setAiToast(null), 4000);
    }
  };

  const handleSyncAnamnese = async () => {
    setIsSyncingAnamnese(true);
    try {
      const res = await getPatientAnamneseAction();
      if (res) {
        setPatientAnamnese(res);
        const mod = res.anamnese.modalidadeTreino;
        let splitSugerido = 'HYROX';
        if (mod === 'hyrox') splitSugerido = 'HYROX';
        else if (mod === 'crossfit') splitSugerido = 'CrossFit';
        else if (mod === 'running_musculacao') splitSugerido = 'RunningStrength';
        else if (mod === 'hiit_forca') splitSugerido = 'HIIT_Forca';
        else if (mod === 'musculacao') splitSugerido = 'PPL';
        handleSplitChange(splitSugerido);
      }
    } finally {
      setIsSyncingAnamnese(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CO-PILOTO BIOMECÂNICO — handleGenerateAITraining()
  // ─────────────────────────────────────────────────────────────────────────
  const handleGenerateAITraining = async () => {
    setIsGenerating(true);
    setAiToast(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const splitDef = TRAINING_SPLITS[selectedSplit] || TRAINING_SPLITS.HYROX;
      const aiGeneratedPlan: WorkoutRoutine[] = JSON.parse(JSON.stringify(splitDef.routines));

      setWorkoutPlan(aiGeneratedPlan);
      setAiToast({
        type: 'success',
        message: `Co-piloto gerou ${aiGeneratedPlan.length} rotinas para "${splitDef.name}" calibrado com a Anamnese e Avaliação do paciente.`,
      });
      setTimeout(() => setAiToast(null), 5000);
    } catch {
      setAiToast({ type: 'error', message: 'Falha na geração. Tente novamente.' });
      setTimeout(() => setAiToast(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Catálogo Filtrado ───
  const filteredExercises = EXERCISE_DATABASE.filter(
    (ex) =>
      (selectedGroup === 'Todos' || ex.group === selectedGroup) &&
      ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Handlers (prontos para a próxima instrução de arrastar/adicionar) ───
  const handleAddExercise = (exercise: Exercise, routineId: string) => {
    setWorkoutPlan((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine;
        // Evita duplicata no mesmo treino
        if (routine.exercises.some((e) => e.exerciseId === exercise.id)) return routine;
        const newItem: PrescribedExercise = {
          exerciseId: exercise.id,
          name: exercise.name,
          sets: 3,
          reps: '8-12',
          rpe: 7,
          rest: 90,
        };
        return { ...routine, exercises: [...routine.exercises, newItem] };
      })
    );
  };

  const handleRemoveExercise = (routineId: string, exerciseId: string) => {
    setWorkoutPlan((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine;
        return { ...routine, exercises: routine.exercises.filter((e) => e.exerciseId !== exerciseId) };
      })
    );
  };

  const handleFieldChange = (
    routineId: string,
    exerciseId: string,
    field: keyof PrescribedExercise,
    value: string | number
  ) => {
    setWorkoutPlan((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine;
        return {
          ...routine,
          exercises: routine.exercises.map((ex) =>
            ex.exerciseId === exerciseId ? { ...ex, [field]: value } : ex
          ),
        };
      })
    );
  };

  // ─── Métricas do Plano ───
  const totalSets = workoutPlan.reduce(
    (sum, r) => sum + r.exercises.reduce((s, e) => s + e.sets, 0),
    0
  );
  const totalExercises = workoutPlan.reduce((sum, r) => sum + r.exercises.length, 0);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-75px)] bg-slate-950 text-slate-200 overflow-hidden">

      {/* ═══════════════════════════════════════════════════════════════════
          LADO ESQUERDO — CONSTRUTOR DO PLANO DE TREINO
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800">

        {/* Header do módulo */}
        <div className="shrink-0 px-6 pt-5 pb-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 space-y-3">
          
          {/* ── BARRA DE INTEGRAÇÃO COM ANAMNESE & DIVISÃO DE TREINO ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Activity className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {patientAnamnese?.nome || 'Paulo Vitor R de Sousa'}
                  </span>
                  {patientAnamnese && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-950/80 border border-violet-700/60 text-violet-300">
                      {patientAnamnese.biometria.pesoKg} kg • {patientAnamnese.biometria.idade} anos • Modalidade: {patientAnamnese.anamnese.modalidadeTreino?.toUpperCase() || 'HYROX'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Anamnese integrada: base de volume, intensidade e distribuição física.
                </p>
              </div>
            </div>

            {/* Seletor de Divisão de Treino & Sincronizador */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 px-2.5 py-1.5 rounded-xl shadow-inner">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Divisão:
                </span>
                <select
                  value={selectedSplit}
                  onChange={(e) => handleSplitChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-1"
                >
                  <optgroup label="Modalidades Híbridas & Racing">
                    <option value="HYROX" className="bg-slate-900 text-white">⚡ HYROX / Fitness Racing (3 Dias)</option>
                    <option value="CrossFit" className="bg-slate-900 text-white">🔥 CrossFit / Metcon (3 Dias)</option>
                    <option value="RunningStrength" className="bg-slate-900 text-white">🏃 Corrida + Musculação (4 Dias)</option>
                    <option value="HIIT_Forca" className="bg-slate-900 text-white">⚡ HIIT + Musculação (3 Dias)</option>
                  </optgroup>
                  <optgroup label="Divisões Clássicas de Hipertrofia">
                    <option value="PPL" className="bg-slate-900 text-white">🏋️ Push / Pull / Legs (PPL - 3 Dias)</option>
                    <option value="UpperLower" className="bg-slate-900 text-white">⚡ Upper / Lower (4 Dias)</option>
                    <option value="FullBody" className="bg-slate-900 text-white">💪 Full Body 3x (3 Dias)</option>
                  </optgroup>
                </select>
              </div>

              {/* Botão Sincronizar Anamnese */}
              <button
                type="button"
                onClick={handleSyncAnamnese}
                disabled={isSyncingAnamnese}
                title="Puxar modalidade da Anamnese do Paciente"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAnamnese ? 'animate-spin text-blue-400' : 'text-blue-400'}`} />
                <span className="hidden sm:inline">Puxar Anamnese</span>
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            {/* Título + Co-piloto */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-[11px] uppercase tracking-widest mb-1">
                <Zap className="w-3.5 h-3.5" />
                Módulo de Performance — NutriAx Pro
              </div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span>{TRAINING_SPLITS[selectedSplit]?.icon || '🏋️'}</span>
                <span>{TRAINING_SPLITS[selectedSplit]?.name || 'Prescrição de Treinamento'}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {TRAINING_SPLITS[selectedSplit]?.badge || 'Personalizado'}
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {TRAINING_SPLITS[selectedSplit]?.description || 'Variáveis de carga por Jim Stoppani · Anatomia por Delavier & Evans'}
              </p>

              {/* ── BOTÃO CO-PILOTO BIOMECÂNICO ── */}
              <button
                onClick={handleGenerateAITraining}
                disabled={isGenerating}
                className={`
                  relative mt-3 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold
                  transition-all duration-300 overflow-hidden
                  disabled:cursor-not-allowed
                  ${
                    isGenerating
                      ? 'bg-violet-900/40 border border-violet-500/30 text-violet-400'
                      : 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.45)] hover:shadow-[0_0_30px_rgba(139,92,246,0.65)] border border-violet-400/30'
                  }
                `}
              >
                {/* Shimmer sweep animado no botão */}
                {!isGenerating && (
                  <span
                    className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    aria-hidden
                  />
                )}

                {isGenerating ? (
                  <>
                    <BrainCircuit className="w-4 h-4 animate-pulse" />
                    <span>Periodizando divisão com IA&hellip;</span>
                    {/* Dots de loading */}
                    <span className="flex gap-0.5 ml-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1 h-1 rounded-full bg-violet-300 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Gerar Treino via IA ({TRAINING_SPLITS[selectedSplit]?.name || 'Divisão Ativa'})</span>
                  </>
                )}
              </button>
            </div>

            {/* Mini métricas HUD */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <span className="block text-xl font-bold text-blue-400">{totalExercises}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Exercícios</span>
              </div>
              <div className="text-center px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                <span className="block text-xl font-bold text-violet-400">{totalSets}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Séries Totais</span>
              </div>
              <div className="text-center px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl">
                <span className="block text-xl font-bold text-white">{workoutPlan.length}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Rotinas</span>
              </div>
            </div>
          </div>

          {/* Seletor da rotina alvo para adição rápida */}
          <div className="pt-2 flex items-center gap-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Rotina Alvo:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {workoutPlan.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setTargetRoutineId(r.id)}
                  className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                    targetRoutineId === r.id
                      ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  <span className="font-bold">{r.id}</span>
                  <span className="text-[10px] opacity-75 max-w-[120px] truncate">{r.name.split('—')[1]?.trim() || r.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── TOAST DE FEEDBACK DO CO-PILOTO ── */}
        {aiToast && (
          <div
            className={`shrink-0 mx-6 mt-4 flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium animate-[fadeIn_0.3s_ease] ${
              aiToast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {aiToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            )}
            <div>
              <span className="block font-bold text-[11px] uppercase tracking-wider mb-0.5">
                {aiToast.type === 'success' ? 'Co-piloto Biomecânico' : 'Erro'}
              </span>
              {aiToast.message}
            </div>
          </div>
        )}

        {/* Lista de Rotinas — scrollável (com Alternância de 2 Cores) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {workoutPlan.map((routine, rIdx) => {
            const isColor2 = rIdx % 2 === 1;
            return (
            <div
              key={routine.id}
              className={`bg-slate-900 border rounded-xl overflow-hidden shadow-lg transition-all ${
                targetRoutineId === routine.id
                  ? (isColor2 ? 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]')
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Cabeçalho da Rotina */}
              <div className="flex justify-between items-center px-5 py-3 bg-slate-900 border-b border-slate-800">
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2.5">
                  <Dumbbell className={`w-4 h-4 ${isColor2 ? 'text-purple-400' : 'text-blue-500'}`} />
                  {routine.name}
                  {targetRoutineId === routine.id && (
                    <span className={`text-[10px] ${isColor2 ? 'bg-purple-600' : 'bg-blue-600'} text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider`}>
                      Alvo
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">
                    {routine.exercises.length} exercício{routine.exercises.length !== 1 ? 's' : ''}
                    {' · '}
                    {routine.exercises.reduce((s, e) => s + e.sets, 0)} séries
                  </span>
                </div>
              </div>

              {/* Cabeçalho das colunas (Stoppani) */}
              {routine.exercises.length > 0 && (
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-5 py-2 bg-slate-900/50 border-b border-slate-800/60">
                  <div className="col-span-5">Exercício</div>
                  <div className="col-span-2 text-center flex items-center justify-center gap-1">
                    <BarChart3 className="w-3 h-3" /> Séries
                  </div>
                  <div className="col-span-2 text-center">Reps</div>
                  <div className="col-span-1 text-center flex items-center justify-center gap-1" title="Rating of Perceived Exertion — Esforço percebido (1-10)">
                    <Target className="w-3 h-3" /> RPE
                  </div>
                  <div className="col-span-1 text-center flex items-center justify-center gap-1">
                    <Timer className="w-3 h-3" /> Pausa
                  </div>
                  <div className="col-span-1" />
                </div>
              )}

              {/* Exercícios prescritos */}
              <div className="flex flex-col divide-y divide-slate-800/50">
                {/* ── SKELETON DE LOADING (Co-piloto gerando) ── */}
                {isGenerating ? (
                  <div className="p-4 space-y-2.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg"
                        style={{ opacity: 1 - i * 0.15 }}
                      >
                        <div className="col-span-5 h-4 bg-slate-800 rounded animate-pulse" />
                        <div className="col-span-2 h-7 bg-slate-800 rounded-lg animate-pulse" />
                        <div className="col-span-2 h-7 bg-slate-800 rounded-lg animate-pulse" />
                        <div className="col-span-1 h-7 bg-violet-900/30 rounded-lg animate-pulse" />
                        <div className="col-span-1 h-7 bg-slate-800 rounded-lg animate-pulse" />
                        <div className="col-span-1" />
                      </div>
                    ))}
                    <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-violet-400 font-semibold animate-pulse">
                      <BrainCircuit className="w-3.5 h-3.5" />
                      Co-piloto calculando variáveis de carga&hellip;
                    </div>
                  </div>
                ) : routine.exercises.length === 0 ? (
                  <div className="m-4 text-center py-8 border border-dashed border-slate-700 rounded-xl text-slate-500 text-sm">
                    <Dumbbell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">Rotina vazia</p>
                    <p className="text-xs mt-1 text-slate-600">
                      Selecione este treino como alvo e clique em{' '}
                      <span className="text-blue-400">+</span> no catálogo ao lado.
                    </p>
                  </div>
                ) : (
                  routine.exercises.map((ex, idx) => (
                    <div
                      key={ex.exerciseId}
                      className="grid grid-cols-12 gap-2 items-center px-5 py-2.5 hover:bg-slate-800/30 transition-colors group/row"
                    >
                      {/* Nome */}
                      <div className="col-span-5 font-medium text-sm text-slate-200 truncate">
                        <span className="text-slate-500 mr-1.5">{idx + 1}.</span>
                        {ex.name}
                      </div>

                      {/* Séries */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={ex.sets}
                          onChange={(e) =>
                            handleFieldChange(routine.id, ex.exerciseId, 'sets', Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-center text-sm font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
                        />
                      </div>

                      {/* Reps */}
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={ex.reps}
                          onChange={(e) =>
                            handleFieldChange(routine.id, ex.exerciseId, 'reps', e.target.value)
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-center text-sm font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
                        />
                      </div>

                      {/* RPE */}
                      <div className="col-span-1">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={ex.rpe}
                          onChange={(e) =>
                            handleFieldChange(routine.id, ex.exerciseId, 'rpe', Number(e.target.value))
                          }
                          className={`w-full bg-slate-950 border rounded-lg p-1.5 text-center text-sm font-bold focus:outline-none focus:ring-1 transition-colors ${
                            ex.rpe >= 9
                              ? 'border-red-500/60 text-red-400 focus:ring-red-500/30'
                              : ex.rpe >= 7
                              ? 'border-amber-500/50 text-amber-400 focus:ring-amber-500/30'
                              : 'border-slate-700 text-slate-300 focus:ring-blue-500/30 focus:border-blue-500'
                          }`}
                        />
                      </div>

                      {/* Pausa (segundos) */}
                      <div className="col-span-1">
                        <input
                          type="number"
                          min={0}
                          step={15}
                          value={ex.rest}
                          onChange={(e) =>
                            handleFieldChange(routine.id, ex.exerciseId, 'rest', Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-center text-sm font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
                        />
                      </div>

                      {/* Remover */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => handleRemoveExercise(routine.id, ex.exerciseId)}
                          className="opacity-0 group-hover/row:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400"
                          title="Remover exercício"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer da Rotina */}
              <div className="px-5 py-3 bg-slate-900/50 border-t border-slate-800/60 flex items-center justify-between">
                <button
                  onClick={() => setTargetRoutineId(routine.id)}
                  className={`text-xs ${isColor2 ? 'text-purple-400 hover:text-purple-300' : 'text-blue-400 hover:text-blue-300'} font-semibold transition-colors`}
                >
                  Definir como alvo de adição →
                </button>
                <span className="text-[11px] text-slate-600 font-mono">
                  {routine.exercises.reduce((s, e) => s + e.sets, 0)} séries ·{' '}
                  {routine.exercises.reduce((s, e) => s + e.sets * Number(String(e.reps).split('-')[0] || 0), 0)} reps est.
                </span>
              </div>
            </div>
            );
          })}

          {/* Botão salvar periodização */}
          <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all mt-2 text-sm tracking-wide">
            Salvar Periodização
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LADO DIREITO — CATÁLOGO ANATÔMICO (Delavier / Evans)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="w-[400px] shrink-0 bg-slate-900 flex flex-col overflow-hidden">

        {/* Header do Catálogo */}
        <div className="shrink-0 px-5 pt-5 pb-4 border-b border-slate-800 bg-slate-900">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-blue-500" />
            Catálogo Anatômico
            <span className="ml-auto text-[11px] text-slate-500 font-normal">
              {EXERCISE_DATABASE.length} exercícios
            </span>
          </h2>

          {/* Busca */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar (ex: Supino, Agachamento)…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 placeholder:text-slate-600 transition-colors"
            />
          </div>

          {/* Filtros por grupo muscular */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1 text-[11px] rounded-full whitespace-nowrap font-bold uppercase tracking-wide transition-all ${
                  selectedGroup === group
                    ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Legenda de destino atual */}
        <div className="shrink-0 px-5 py-2 bg-blue-500/5 border-b border-blue-500/20 flex items-center gap-2">
          <span className="text-[11px] text-slate-400">
            Clique em{' '}
            <span className="font-bold text-blue-400">+</span> para adicionar ao{' '}
            <span className="font-bold text-blue-400">
              Treino {targetRoutineId}
            </span>
          </span>
        </div>

        {/* Lista de exercícios do catálogo */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum exercício encontrado.</p>
            </div>
          ) : (
            filteredExercises.map((ex) => {
              const alreadyAdded = workoutPlan
                .find((r) => r.id === targetRoutineId)
                ?.exercises.some((e) => e.exerciseId === ex.id);

              return (
                <div
                  key={ex.id}
                  className={`bg-slate-950 border rounded-xl p-3.5 transition-all group/card ${
                    alreadyAdded
                      ? 'border-blue-500/40 opacity-60'
                      : 'border-slate-800 hover:border-blue-500/40 hover:shadow-[0_0_12px_rgba(59,130,246,0.08)]'
                  }`}
                >
                  {/* Nome + botão adicionar */}
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-semibold text-sm text-slate-100 leading-tight">
                      {ex.name}
                    </h3>
                    <button
                      onClick={() => !alreadyAdded && handleAddExercise(ex, targetRoutineId)}
                      disabled={alreadyAdded}
                      title={alreadyAdded ? 'Já adicionado nesta rotina' : `Adicionar ao Treino ${targetRoutineId}`}
                      className={`shrink-0 p-1.5 rounded-lg transition-all ${
                        alreadyAdded
                          ? 'text-blue-500 bg-blue-500/10 cursor-default'
                          : 'text-slate-500 bg-slate-800 hover:text-white hover:bg-blue-600 hover:shadow-[0_0_8px_rgba(59,130,246,0.5)] opacity-0 group-hover/card:opacity-100'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md tracking-wider ${MECHANICS_COLOR[ex.mechanics]}`}>
                      {ex.mechanics}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md tracking-wider text-slate-400 bg-slate-800 border border-slate-700/50">
                      {ex.group}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md tracking-wider text-slate-500 bg-slate-800/50 border border-slate-800">
                      {ex.equipment}
                    </span>
                  </div>

                  {/* Músculos (Delavier) */}
                  <div className="flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
                    <Info className="w-3.5 h-3.5 shrink-0 text-slate-500 mt-0.5" />
                    <div>
                      <span className="text-slate-300 font-semibold">Primário: </span>
                      {ex.primaryMuscle}
                      <br />
                      <span className="text-slate-300 font-semibold">Secundários: </span>
                      <span className="text-slate-500">{ex.secondaryMuscles}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
