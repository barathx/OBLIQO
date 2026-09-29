import type { Obligation, FutureFund, ShieldCommitment, Notification, ActivityEvent, SourceMessage, SourceStatus, ScanSummary } from '@/types/obligation';
export const DEMO_TODAY = new Date().toISOString().slice(0, 10);
export const initialObligations: Obligation[] = [
  { id:'car-insurance', title:'Car Insurance Renewal', category:'Insurance', amount:8500, dueDate:'2026-10-05', priority:'High', recurrence:'Yearly', source:'Telegram', status:'Pending', createdAt:'2026-09-29', description:'Your car insurance renewal is approaching and requires ₹8,500. Renewing on time helps you avoid a gap in coverage.' },
  { id:'electricity', title:'Electricity Bill', category:'Utilities', amount:2450, dueDate:'2026-09-30', priority:'Critical', recurrence:'Monthly', source:'Gmail', status:'Pending', createdAt:'2026-09-26', description:'Your electricity bill is due today. Take care of it to avoid a late fee or service interruption.' },
  { id:'vehicle-service', title:'Vehicle Service', category:'Vehicle', amount:3000, dueDate:'2026-10-12', priority:'Medium', recurrence:'Yearly', source:'Telegram', status:'Pending', createdAt:'2026-09-22', description:'Your scheduled vehicle service is coming up. Regular servicing helps keep your vehicle reliable.' },
  { id:'netflix', title:'Netflix Subscription', category:'Subscriptions', amount:649, dueDate:'2026-10-25', priority:'Low', recurrence:'Monthly', source:'Gmail', status:'Pending', createdAt:'2026-09-20', description:'Your monthly subscription renews automatically. Review it before the next billing date.' },
  { id:'driving-license', title:'Driving License Renewal', category:'Documents', amount:1200, dueDate:'2026-11-03', priority:'High', recurrence:'Yearly', source:'Document', status:'Pending', createdAt:'2026-09-19', description:'Your driving license is due for renewal. Prepare the necessary documents ahead of time.' },
  { id:'internet', title:'Broadband Bill', category:'Utilities', amount:1199, dueDate:'2026-09-30', priority:'Medium', recurrence:'Monthly', source:'Gmail', status:'Pending', createdAt:'2026-09-25', description:'Your broadband bill is due today. Settle it to keep your connection uninterrupted.' },
  { id:'health-insurance', title:'Health Insurance Premium', category:'Insurance', amount:14500, dueDate:'2026-10-07', priority:'High', recurrence:'Yearly', source:'Gmail', status:'Pending', createdAt:'2026-09-24', description:'Your health insurance premium is due soon. Keeping it current helps maintain your coverage.' },
  { id:'rent', title:'October Rent', category:'Housing', amount:18000, dueDate:'2026-10-01', priority:'High', recurrence:'Monthly', source:'Calendar', status:'Pending', createdAt:'2026-09-21', description:'Your monthly rent is due at the beginning of October.' },
  { id:'gym', title:'Gym Membership', category:'Subscriptions', amount:1800, dueDate:'2026-10-18', priority:'Low', recurrence:'Monthly', source:'Gmail', status:'Pending', createdAt:'2026-09-18', description:'Your gym membership renews this month. Review your membership if your plans have changed.' },
  { id:'passport', title:'Passport Expiration', category:'Documents', amount:1500, dueDate:'2026-11-20', priority:'Medium', recurrence:'One-time', source:'Document', status:'Pending', createdAt:'2026-09-15', description:'Your passport expires soon. Begin the renewal process early if you plan to travel.' },
  { id:'tuition', title:'School Tuition Instalment', category:'Education', amount:12500, dueDate:'2026-10-15', priority:'High', recurrence:'Quarterly', source:'Gmail', status:'Pending', createdAt:'2026-09-17', description:'The next tuition instalment is due in October. Plan ahead to avoid a late charge.' },
  { id:'warranty', title:'Laptop Warranty Expiration', category:'Warranty', amount:0, dueDate:'2026-11-12', priority:'Low', recurrence:'One-time', source:'Document', status:'Pending', createdAt:'2026-09-12', description:'Your laptop warranty is ending. Check for any outstanding repairs while coverage remains.' },
  { id:'water', title:'Water Bill', category:'Utilities', amount:780, dueDate:'2026-09-22', priority:'Low', recurrence:'Monthly', source:'Gmail', status:'Completed', createdAt:'2026-09-12', description:'Your September water bill has been taken care of.' },
  { id:'dentist', title:'Dental Appointment', category:'Appointments', amount:900, dueDate:'2026-10-21', priority:'Medium', recurrence:'One-time', source:'Calendar', status:'Pending', createdAt:'2026-09-14', description:'Your dental checkup is scheduled for October 21.' },
  { id:'cloud', title:'Cloud Storage Renewal', category:'Subscriptions', amount:1300, dueDate:'2026-11-08', priority:'Low', recurrence:'Yearly', source:'Gmail', status:'Pending', createdAt:'2026-09-10', description:'Your cloud storage plan renews in November. Review your usage before renewal.' },
];
export const initialFunds: FutureFund[] = [
  { id:'fund-insurance', obligationId:'car-insurance', title:'Car Insurance', target:12000, prepared:8000, monthsRemaining:2, status:'Planning' },
  { id:'fund-service', obligationId:'vehicle-service', title:'Vehicle Service', target:3000, prepared:1200, monthsRemaining:1, status:'Planning' },
  { id:'fund-subscription', title:'Annual Subscription', target:6000, prepared:1500, monthsRemaining:4, status:'Planning' },
];
export const initialShields: ShieldCommitment[] = [
  { id:'shield-insurance', obligationId:'car-insurance', consequence:30, commitment:1, status:'Inactive' },
  { id:'shield-license', obligationId:'driving-license', consequence:20, commitment:1, status:'Inactive' },
  { id:'shield-health', obligationId:'health-insurance', consequence:50, commitment:1, status:'Active' },
];
export const initialNotifications: Notification[] = [
  { id:'n1', title:'New obligation detected', message:'Car Insurance Renewal was detected from Telegram.', time:'Today · 10:32 AM', read:false, obligationId:'car-insurance' },
  { id:'n2', title:'Priority updated', message:'Electricity Bill was classified as Critical.', time:'Today · 10:32 AM', read:false, obligationId:'electricity' },
  { id:'n3', title:'Preparation suggestion', message:'₹2,000/month could prepare you for the upcoming insurance renewal.', time:'Today · 10:35 AM', read:false, obligationId:'car-insurance' },
  { id:'n4', title:'Reminder scheduled', message:'Reminder set for Health Insurance Premium.', time:'Yesterday · 7:15 PM', read:true, obligationId:'health-insurance' },
  { id:'n5', title:'Completed', message:'Water Bill marked complete.', time:'Sep 22 · 6:20 PM', read:true, obligationId:'water' },
];
export const initialActivity: ActivityEvent[] = [
  { id:'a1', title:'Insurance renewal detected', detail:'Car Insurance Renewal · Telegram', time:'Today · 10:32 AM', obligationId:'car-insurance', kind:'detected' },
  { id:'a2', title:'Priority calculated: High', detail:'Car Insurance Renewal', time:'Today · 10:32 AM', obligationId:'car-insurance', kind:'priority' },
  { id:'a3', title:'Future Fund suggested', detail:'Car Insurance · ₹2,000 per month', time:'Today · 10:35 AM', obligationId:'car-insurance', kind:'fund' },
  { id:'a4', title:'Water bill completed', detail:'Water Bill', time:'Sep 22 · 6:20 PM', obligationId:'water', kind:'completed' },
];

export const sourceStatus: SourceStatus[] = [
  { source:'Gmail', status:'Connected' }, { source:'Telegram', status:'Connected' }, { source:'Calendar', status:'Connected' }, { source:'Document', status:'Coming soon' },
];
export const initialLastScan: ScanSummary = { scannedAt:'Today, 10:32 AM', detected:3, bySource:{ Gmail:1, Telegram:2 }, obligationIds:['car-insurance','electricity','vehicle-service'] };
const msg = (obligationId:string, source:SourceMessage['source'], sender:string, timestamp:string, content:string): SourceMessage => ({ id:`m-${obligationId}`, obligationId, source, sender, timestamp, content });
export const initialMessages: SourceMessage[] = [
  msg('car-insurance','Telegram','Acko Insurance','Sep 29 · 9:14 AM','Your car insurance policy expires on October 5, 2026. Renewal amount: ₹8,500.'),
  msg('electricity','Gmail','BESCOM Billing','Sep 26 · 7:02 AM','Your electricity bill of ₹2,450 for September is due on September 30, 2026. Pay on time to avoid a late fee.'),
  msg('vehicle-service','Telegram','Maruti Service Centre','Sep 22 · 11:40 AM','Your annual vehicle service is scheduled for October 12, 2026. Estimated cost: ₹3,000.'),
  msg('netflix','Gmail','Netflix','Sep 20 · 6:30 PM','Your Netflix membership will renew on October 25, 2026 for ₹649.'),
  msg('driving-license','Document','Driving license scan','Sep 19 · 4:05 PM','Driving licence valid till: 03/11/2026. Renewal fee: ₹1,200.'),
  msg('internet','Gmail','Airtel Xstream','Sep 25 · 8:10 AM','Your broadband bill of ₹1,199 is due on September 30, 2026.'),
  msg('health-insurance','Gmail','Star Health','Sep 24 · 10:22 AM','Your annual health insurance premium of ₹14,500 is due on October 7, 2026.'),
  msg('rent','Calendar','Calendar event','Sep 21 · 9:00 AM','Pay October rent — ₹18,000 — October 1, 2026 (repeats monthly).'),
  msg('gym','Gmail','Cult.fit','Sep 18 · 5:45 PM','Your gym membership renews on October 18, 2026 for ₹1,800.'),
  msg('passport','Document','Passport scan','Sep 15 · 3:20 PM','Date of expiry: 20/11/2026. Reissue fee: ₹1,500.'),
  msg('tuition','Gmail','Greenwood School Accounts','Sep 17 · 12:10 PM','The Q3 tuition instalment of ₹12,500 is due by October 15, 2026.'),
  msg('warranty','Document','Laptop invoice','Sep 12 · 2:00 PM','Manufacturer warranty valid until November 12, 2026.'),
  msg('water','Gmail','BWSSB','Sep 15 · 9:30 AM','Your water bill of ₹780 is due on September 22, 2026.'),
  msg('dentist','Calendar','Calendar event','Sep 16 · 10:00 AM','Dental check-up — October 21, 2026, 11:00 AM. Consultation: ₹900.'),
  msg('cloud','Gmail','Google One','Sep 14 · 8:00 PM','Your 2 TB storage plan renews on November 8, 2026 for ₹1,300.'),
];
/** Obligations the simulated "Scan now" will discover. */
export const scanPool: { obligation: Obligation; message: SourceMessage }[] = [
  { obligation:{ id:'property-tax', title:'Property Tax', category:'Housing', amount:6200, dueDate:'2026-10-20', priority:'High', recurrence:'Yearly', source:'Gmail', status:'Pending', createdAt:'2026-09-30', description:'Your annual property tax is due in October. Paying before the deadline avoids a penalty.' }, message:msg('property-tax','Gmail','Municipal Corporation','Today · 10:48 AM','Property tax for 2026–27 of ₹6,200 is payable by October 20, 2026.') },
  { obligation:{ id:'mobile-bill', title:'Mobile Postpaid Bill', category:'Utilities', amount:599, dueDate:'2026-10-04', priority:'Medium', recurrence:'Monthly', source:'Telegram', status:'Pending', createdAt:'2026-09-30', description:'Your mobile bill is due in a few days. Settle it to keep your number active.' }, message:msg('mobile-bill','Telegram','Jio','Today · 10:47 AM','Your postpaid bill of ₹599 is due on October 4, 2026.') },
  { obligation:{ id:'purifier-service', title:'Water Purifier Service', category:'Appointments', amount:1100, dueDate:'2026-10-09', priority:'Low', recurrence:'Yearly', source:'Telegram', status:'Pending', createdAt:'2026-09-30', description:'Your annual water purifier service is due. Book a visit that suits your schedule.' }, message:msg('purifier-service','Telegram','Aquaguard Care','Today · 10:46 AM','Annual service due on October 9, 2026. Service charge: ₹1,100.') },
];
