import { ProtocolStep, ProtocolStatus } from './types';

export const INITIAL_PROTOCOL_STEPS: ProtocolStep[] = [
    { id: 'p0', text: 'البروتوكول 0: تجهيز البيانات المصدر', status: ProtocolStatus.PENDING },
    { id: 'p1', text: 'البروتوكول 1: توليد المحتوى الطبي', status: ProtocolStatus.PENDING },
    { id: 'p2', text: 'البروتوكول 2: تصحيح توزيع الإجابات', status: ProtocolStatus.PENDING },
    { id: 'p2.8', text: 'البروتوكول 2.8: التدقيق النقدي والتصحيح الآلي', status: ProtocolStatus.PENDING },
    { id: 'p2.7', text: 'البروتوكول 2.7: تدقيق وتحسين التفسيرات', status: ProtocolStatus.PENDING },
    { id: 'p3', text: 'البروتوكول 3: توليد صفحة الاختبار النهائية', status: ProtocolStatus.PENDING },
    { id: 'p4', text: 'البروتوكول 4: المراجعة النهائية والختام', status: ProtocolStatus.PENDING },
];

export const SUCCESS_MESSAGES = ["زوجك الله بأربع نساء يا فتي... وإن كنتِ فتاة، ربنا يرزقك بثري خليجي!", "إيه العظمة دي! أنت دكتور كبير أوي.", "عاش يا وحش! شكلك كنت مركز أوي."];
export const FAILURE_MESSAGES = ["ماذا نحن بفاعلون؟ 😡 نأخذ من كل رجل قبيلة، يا ساقط.", "شكلك كنت بتفتح فيسبوك وأنت بتمتحن!", "لا تقلق، أول خطوة في طريق المليون ميل تبدأ بكَعبَلة."];
