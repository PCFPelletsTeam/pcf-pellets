import { Decimal } from 'decimal.js';
import { Unit } from '@pcf/shared';
import { UnitConversionService } from '../units.service';

describe('UnitConversionService', () => {
  const svc = new UnitConversionService();

  describe('mass class', () => {
    it('1 t → 1000 kg', () => {
      expect(svc.convert(1, Unit.TONNE, Unit.KG).eq(1000)).toBe(true);
    });
    it('500 kg → 0.5 t', () => {
      expect(svc.convert(500, Unit.KG, Unit.TONNE).eq('0.5')).toBe(true);
    });
    it('identity: 100 kg → 100 kg', () => {
      expect(svc.convert(100, Unit.KG, Unit.KG).eq(100)).toBe(true);
    });
  });

  describe('energy class', () => {
    it('1 MWh → 1000 kWh', () => {
      expect(svc.convert(1, Unit.MWH, Unit.KWH).eq(1000)).toBe(true);
    });
    it('1 kWh → 3.6 MJ', () => {
      const result = svc.convert(1, Unit.KWH, Unit.MJ);
      expect(result.toFixed(10)).toBe(new Decimal('3.6').toFixed(10));
    });
    it('1 GJ → 1000 MJ', () => {
      const result = svc.convert(1, Unit.GJ, Unit.MJ);
      expect(result.toFixed(6)).toBe('1000.000000');
    });
    it('3.6 MJ → 1 kWh (round-trip)', () => {
      const result = svc.convert('3.6', Unit.MJ, Unit.KWH);
      expect(result.toFixed(10)).toBe('1.0000000000');
    });
  });

  describe('volume class', () => {
    it('1 m³ → 1000 L', () => {
      expect(svc.convert(1, Unit.M3, Unit.LITRE).eq(1000)).toBe(true);
    });
  });

  describe('cross-class — заборонено', () => {
    it('kg → kWh кидає 400', () => {
      expect(() => svc.convert(1, Unit.KG, Unit.KWH)).toThrow(
        /Не можна конвертувати kg \(mass\) → kWh \(energy\)/,
      );
    });
    it('m³ → kg кидає 400', () => {
      expect(() => svc.convert(1, Unit.M3, Unit.KG)).toThrow(
        /Не можна конвертувати/,
      );
    });
  });

  describe('factor() — точність', () => {
    it('зворотні множники узгоджуються (kg→t × t→kg = 1)', () => {
      const f1 = svc.factor(Unit.KG, Unit.TONNE);
      const f2 = svc.factor(Unit.TONNE, Unit.KG);
      expect(f1.mul(f2).eq(1)).toBe(true);
    });
    it('кругова конверсія MJ → GJ → MJ = 1', () => {
      const a = svc.convert(1234.5, Unit.MJ, Unit.GJ);
      const back = svc.convert(a, Unit.GJ, Unit.MJ);
      expect(back.eq(1234.5)).toBe(true);
    });
  });
});
