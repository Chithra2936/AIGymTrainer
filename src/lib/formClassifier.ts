import * as tf from '@tensorflow/tfjs';
import type { ExerciseId, JointId } from '../types';
import { getJointAngle, type Landmarks } from './poseUtils';
import { EXERCISES } from './exercises';

export type FormQuality = 'good' | 'needs_work' | 'poor';

export interface ClassificationResult {
  quality: FormQuality;
  confidence: number;
  scores: { good: number; needs_work: number; poor: number };
}

export type ModelStatus = 'untrained' | 'training' | 'ready';

const NUM_JOINTS = 8;
const INPUT_SIZE = NUM_JOINTS + 1;
const NUM_CLASSES = 3;
const QUALITIES: FormQuality[] = ['good', 'needs_work', 'poor'];

const ALL_JOINTS: JointId[] = [
  'left_elbow',
  'right_elbow',
  'left_shoulder',
  'right_shoulder',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
];

function extractFeatures(landmarks: Landmarks, exerciseId: ExerciseId): number[] {
  const angles = ALL_JOINTS.map((j) => getJointAngle(landmarks, j) / 180);
  const exIndex = EXERCISES.findIndex((e) => e.id === exerciseId) / EXERCISES.length;
  return [...angles, exIndex];
}

function generateSyntheticDataset(): { xs: number[][]; ys: number[][] } {
  const xs: number[][] = [];
  const ys: number[][] = [];
  const samplesPerClass = 80;

  for (let i = 0; i < EXERCISES.length; i++) {
    const ex = EXERCISES[i];
    const exIndex = i / EXERCISES.length;

    for (let s = 0; s < samplesPerClass; s++) {
      const t = s / samplesPerClass;

      // GOOD form: angles near ideal ranges, minor noise
      {
        const angles = ALL_JOINTS.map((j) => {
          const ideal = getIdealAngle(j, ex.id);
          const noise = (Math.random() - 0.5) * 0.08;
          return Math.max(0, Math.min(1, ideal / 180 + noise));
        });
        xs.push([...angles, exIndex]);
        ys.push([1, 0, 0]);
      }

      // NEEDS_WORK: moderate deviation
      {
        const angles = ALL_JOINTS.map((j) => {
          const ideal = getIdealAngle(j, ex.id);
          const deviation = 0.12 + t * 0.08;
          const noise = (Math.random() - 0.5) * 0.06;
          return Math.max(0, Math.min(1, ideal / 180 + deviation + noise));
        });
        xs.push([...angles, exIndex]);
        ys.push([0, 1, 0]);
      }

      // POOR: large deviation
      {
        const angles = ALL_JOINTS.map((j) => {
          const ideal = getIdealAngle(j, ex.id);
          const deviation = 0.25 + t * 0.15;
          const noise = (Math.random() - 0.5) * 0.1;
          return Math.max(0, Math.min(1, ideal / 180 + deviation + noise));
        });
        xs.push([...angles, exIndex]);
        ys.push([0, 0, 1]);
      }
    }
  }

  return { xs, ys };
}

function getIdealAngle(joint: JointId, exerciseId: ExerciseId): number {
  const ex = EXERCISES.find((e) => e.id === exerciseId);
  if (!ex) return 120;

  if (joint === ex.primaryJoint) {
    return (ex.downAngle + ex.upAngle) / 2;
  }

  for (const rule of ex.formFeedback) {
    if (rule.joint === joint) {
      if (rule.minAngle !== undefined) return rule.minAngle + 10;
      if (rule.maxAngle !== undefined) return rule.maxAngle - 10;
    }
  }

  return 120;
}

export class FormClassifier {
  private model: tf.LayersModel | null = null;
  private status: ModelStatus = 'untrained';
  private listeners: ((status: ModelStatus) => void)[] = [];

  onStatusChange(cb: (status: ModelStatus) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private setStatus(s: ModelStatus) {
    this.status = s;
    this.listeners.forEach((l) => l(s));
  }

  getStatus() {
    return this.status;
  }

  async train(): Promise<void> {
    this.setStatus('training');

    try {
      await tf.ready();

      if (this.model) {
        this.model.dispose();
        this.model = null;
      }

      const model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [INPUT_SIZE],
            units: 32,
            activation: 'relu',
            kernelInitializer: 'heNormal',
          }),
          tf.layers.dropout({ rate: 0.15 }),
          tf.layers.dense({
            units: 16,
            activation: 'relu',
            kernelInitializer: 'heNormal',
          }),
          tf.layers.dropout({ rate: 0.1 }),
          tf.layers.dense({
            units: NUM_CLASSES,
            activation: 'softmax',
          }),
        ],
      });

      model.compile({
        optimizer: tf.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
      });

      const { xs, ys } = generateSyntheticDataset();

      const xsTensor = tf.tensor2d(xs);
      const ysTensor = tf.tensor2d(ys);

      await model.fit(xsTensor, ysTensor, {
        epochs: 40,
        batchSize: 32,
        shuffle: true,
        verbose: 0,
      });

      xsTensor.dispose();
      ysTensor.dispose();

      this.model = model;
      this.setStatus('ready');
    } catch {
      this.setStatus('untrained');
    }
  }

  classify(landmarks: Landmarks, exerciseId: ExerciseId): ClassificationResult {
    if (!this.model || this.status !== 'ready') {
      return {
        quality: 'needs_work',
        confidence: 0,
        scores: { good: 0, needs_work: 0, poor: 0 },
      };
    }

    const features = extractFeatures(landmarks, exerciseId);
    const input = tf.tensor2d([features]);
    const output = this.model.predict(input) as tf.Tensor;
    const data = output.dataSync();

    input.dispose();
    output.dispose();

    const scores = {
      good: data[0],
      needs_work: data[1],
      poor: data[2],
    };

    let maxIdx = 0;
    let maxVal = data[0];
    for (let i = 1; i < data.length; i++) {
      if (data[i] > maxVal) {
        maxVal = data[i];
        maxIdx = i;
      }
    }

    return {
      quality: QUALITIES[maxIdx],
      confidence: maxVal,
      scores,
    };
  }

  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.setStatus('untrained');
  }
}

export const formClassifier = new FormClassifier();
