import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { MaterialCategory, Unit } from '@pcf/shared';
import type { CreateMaterialDto } from '../dto/create-material.dto';
import { MaterialsService } from '../materials.service';

/**
 * Заповнює довідник `materials` типовим набором при першому старті.
 * Idempotent: якщо таблиця вже не порожня — нічого не робить.
 *
 * Список побудований під специфіку гірничо-металургійної галузі Кривого Рогу
 * (Полтавський ГЗК, ЦГЗК, ArcelorMittal): 10 матеріалів та енергоносіїв,
 * які покривають типове виробництво залізорудних окатишів cradle-to-gate.
 */
@Injectable()
export class MaterialsSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(MaterialsSeeder.name);

  constructor(private readonly materialsService: MaterialsService) {}

  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.materialsService.count();
    if (existing > 0) {
      this.logger.log(`materials: ${existing} запис(ів) — seed пропускаю`);
      return;
    }

    this.logger.log(
      `materials: таблиця порожня — заповнюю ${SEED.length} типовими записами`,
    );
    await this.materialsService.bulkInsert(SEED);
    this.logger.log(`materials: seed завершено (${SEED.length} матеріалів)`);
  }
}

const SEED: CreateMaterialDto[] = [
  {
    name: 'Магнетитовий концентрат',
    category: MaterialCategory.IRON_ORE_CONCENTRATE,
    defaultUnit: Unit.TONNE,
    description: 'Залізорудний концентрат, типово Fe ≥ 65%, вологість ≤ 9%',
  },
  {
    name: 'Бентоніт',
    category: MaterialCategory.BENTONITE,
    defaultUnit: Unit.TONNE,
    description: "Зв'язуюча добавка для огрудкування (≈ 0.5–1.0% маси шихти)",
  },
  {
    name: 'Вапняк',
    category: MaterialCategory.LIMESTONE,
    defaultUnit: Unit.TONNE,
    description:
      'CaCO₃, флюс — частина CO₂ виділяється при кальцинації (Scope 1, process)',
  },
  {
    name: 'Доломіт',
    category: MaterialCategory.DOLOMITE,
    defaultUnit: Unit.TONNE,
    description: '(Ca,Mg)CO₃, флюс для регулювання основності',
  },
  {
    name: "Кокс (коксовий дріб'язок)",
    category: MaterialCategory.COKE,
    defaultUnit: Unit.TONNE,
    description: 'Твердий вуглецевий відновник у шихті (≈ 1–2% маси)',
  },
  {
    name: 'Природний газ',
    category: MaterialCategory.NATURAL_GAS,
    defaultUnit: Unit.M3,
    description: 'Основне паливо випалу окатишів (Scope 1)',
  },
  {
    name: "Кам'яне вугілля",
    category: MaterialCategory.COAL,
    defaultUnit: Unit.TONNE,
    description: 'Допоміжне паливо (Scope 1)',
  },
  {
    name: 'Мазут',
    category: MaterialCategory.HEAVY_FUEL_OIL,
    defaultUnit: Unit.TONNE,
    description: 'Резервне паливо випалу',
  },
  {
    name: 'Електроенергія',
    category: MaterialCategory.ELECTRICITY,
    defaultUnit: Unit.KWH,
    description:
      'Закуплена електроенергія (Scope 2). EF залежить від джерела (UA grid / nuclear PPA / coal)',
  },
  {
    name: 'Тепло (закуплене)',
    category: MaterialCategory.HEAT,
    defaultUnit: Unit.GJ,
    description: 'Закуплене тепло (Scope 2)',
  },
];
