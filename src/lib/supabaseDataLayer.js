import { getSupabase } from './supabaseClient';

const getClient = async () => getSupabase();

/**
 * Supabase Data Layer
 * Abstraction for all entity operations — replaces Base44 entities
 */

const db = {
  // AIRCRAFT
  aircraft: {
    list: async (orderBy = 'tail_number', limit = 500) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('Aircraft')
        .select('*')
        .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    filter: async (filters = {}, limit = 500) => {
      const supabase = await getClient();
      let query = supabase.from('Aircraft').select('*');
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return data || [];
    },
    get: async (id) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('Aircraft')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (record) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('Aircraft')
        .insert([record])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, updates) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('Aircraft')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const supabase = await getClient();
      const { error } = await supabase
        .from('Aircraft')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  // FLIGHTS
  flight: {
    list: async (orderBy = '-flight_date', limit = 500) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('Flight')
        .select('*')
        .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    filter: async (filters = {}, limit = 500) => {
      const supabase = await getClient();
      let query = supabase.from('Flight').select('*');
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return data || [];
    },
    create: async (record) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('Flight')
        .insert([record])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, updates) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('Flight')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  // LOGBOOK ENTRIES
  logbookEntry: {
    list: async (orderBy = '-created_date', limit = 10000) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('LogbookEntry')
        .select('*')
        .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    filter: async (filters = {}, limit = 10000) => {
      const supabase = await getClient();
      let query = supabase.from('LogbookEntry').select('*');
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return data || [];
    },
    create: async (record) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('LogbookEntry')
        .insert([record])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, updates) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('LogbookEntry')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  // FAULT MESSAGES
  faultMessage: {
    list: async (orderBy = '-created_date', limit = 5000) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('FaultMessage')
        .select('*')
        .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    filter: async (filters = {}, limit = 5000) => {
      const supabase = await getClient();
      let query = supabase.from('FaultMessage').select('*');
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return data || [];
    },
    create: async (record) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('FaultMessage')
        .insert([record])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, updates) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('FaultMessage')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  // MEL ITEMS
  melItem: {
    list: async (orderBy = '-created_date', limit = 2000) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('MELItem')
        .select('*')
        .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    filter: async (filters = {}, limit = 2000) => {
      const supabase = await getClient();
      let query = supabase.from('MELItem').select('*');
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return data || [];
    },
  },

  // MAINTENANCE EVENTS
  maintenanceEvent: {
    list: async (orderBy = '-completed_date', limit = 3000) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('MaintenanceEvent')
        .select('*')
        .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    filter: async (filters = {}, limit = 3000) => {
      const supabase = await getClient();
      let query = supabase.from('MaintenanceEvent').select('*');
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return data || [];
    },
  },

  // COMPONENT LIFECYCLE
  componentLifecycle: {
    list: async (orderBy = '-created_date', limit = 2000) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('ComponentLifecycle')
        .select('*')
        .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    filter: async (filters = {}, limit = 2000) => {
      const supabase = await getClient();
      let query = supabase.from('ComponentLifecycle').select('*');
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return data || [];
    },
  },

  // AIRWORTHINESS DIRECTIVES
  airworthinessDirective: {
    list: async (orderBy = '-created_date', limit = 1000) => {
      const supabase = await getClient();
      const { data, error } = await supabase
        .from('AirworthinessDirective')
        .select('*')
        .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    filter: async (filters = {}, limit = 1000) => {
      const supabase = await getClient();
      let query = supabase.from('AirworthinessDirective').select('*');
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return data || [];
    },
  },
};

export default db;