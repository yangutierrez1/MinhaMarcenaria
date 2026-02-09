import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xmqlnjryweijnkoxivzh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_doYAP59Tx04_sJu6TA_3UA_AvgdhCBf';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);