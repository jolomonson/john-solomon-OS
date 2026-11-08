export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assets: {
        Row: {
          attention: string
          cash_available_ngn: number | null
          created_at: string
          custom: Json
          id: string
          monthly_expenses_ngn: number | null
          name: string
          notes: string | null
          objective_2027: string | null
          ownership: string
          parent_id: string | null
          priority: number | null
          role: string | null
          sector: string | null
          stage: string | null
          type: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          attention?: string
          cash_available_ngn?: number | null
          created_at?: string
          custom?: Json
          id?: string
          monthly_expenses_ngn?: number | null
          name: string
          notes?: string | null
          objective_2027?: string | null
          ownership: string
          parent_id?: string | null
          priority?: number | null
          role?: string | null
          sector?: string | null
          stage?: string | null
          type: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Update: {
          attention?: string
          cash_available_ngn?: number | null
          created_at?: string
          custom?: Json
          id?: string
          monthly_expenses_ngn?: number | null
          name?: string
          notes?: string | null
          objective_2027?: string | null
          ownership?: string
          parent_id?: string | null
          priority?: number | null
          role?: string | null
          sector?: string | null
          stage?: string | null
          type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_asset_focus"
            referencedColumns: ["asset_id"]
          },
        ]
      }
      contacts: {
        Row: {
          asset_id: string | null
          category: string | null
          created_at: string
          how_met: string | null
          id: string
          last_contact: string | null
          name: string
          next_step: string | null
          notes: string | null
          organisation: string | null
          strength: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          category?: string | null
          created_at?: string
          how_met?: string | null
          id?: string
          last_contact?: string | null
          name: string
          next_step?: string | null
          notes?: string | null
          organisation?: string | null
          strength?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          asset_id?: string | null
          category?: string | null
          created_at?: string
          how_met?: string | null
          id?: string
          last_contact?: string | null
          name?: string
          next_step?: string | null
          notes?: string | null
          organisation?: string | null
          strength?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "v_asset_focus"
            referencedColumns: ["asset_id"]
          },
        ]
      }
      countries: {
        Row: {
          country: string
          created_at: string
          id: string
          notes: string | null
          planned_date: string | null
          purpose: string | null
          status: string
          updated_at: string
          user_id: string
          visited_date: string | null
        }
        Insert: {
          country: string
          created_at?: string
          id?: string
          notes?: string | null
          planned_date?: string | null
          purpose?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          visited_date?: string | null
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          notes?: string | null
          planned_date?: string | null
          purpose?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          visited_date?: string | null
        }
        Relationships: []
      }
      decisions: {
        Row: {
          asset_id: string | null
          created_at: string
          decided_on: string
          id: string
          options: string | null
          outcome: string | null
          reasoning: string | null
          review_on: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          decided_on: string
          id?: string
          options?: string | null
          outcome?: string | null
          reasoning?: string | null
          review_on?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          decided_on?: string
          id?: string
          options?: string | null
          outcome?: string | null
          reasoning?: string | null
          review_on?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "v_asset_focus"
            referencedColumns: ["asset_id"]
          },
        ]
      }
      equity_stakes: {
        Row: {
          annual_revenue_ngn: number | null
          asset_id: string | null
          company_value_ngn: number | null
          created_at: string
          id: string
          last_updated: string | null
          ownership_pct: number | null
          updated_at: string
          user_id: string
          valuation_basis: string | null
        }
        Insert: {
          annual_revenue_ngn?: number | null
          asset_id?: string | null
          company_value_ngn?: number | null
          created_at?: string
          id?: string
          last_updated?: string | null
          ownership_pct?: number | null
          updated_at?: string
          user_id?: string
          valuation_basis?: string | null
        }
        Update: {
          annual_revenue_ngn?: number | null
          asset_id?: string | null
          company_value_ngn?: number | null
          created_at?: string
          id?: string
          last_updated?: string | null
          ownership_pct?: number | null
          updated_at?: string
          user_id?: string
          valuation_basis?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equity_stakes_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equity_stakes_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "v_asset_focus"
            referencedColumns: ["asset_id"]
          },
        ]
      }
      expense_entries: {
        Row: {
          amount: number
          amount_ngn: number
          category: string | null
          created_at: string
          currency: string
          description: string | null
          entry_date: string
          fx_used: number | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          amount_ngn?: number
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          entry_date: string
          fx_used?: number | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          amount_ngn?: number
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          entry_date?: string
          fx_used?: number | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_assets: {
        Row: {
          asset_id: string
          created_at: string
          goal_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          goal_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          goal_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "v_asset_focus"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "goal_assets_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_assets_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          baseline: number | null
          category: string
          created_at: string
          current: number | null
          id: string
          kpi_name: string | null
          kpi_unit: string | null
          notes: string | null
          number: number
          outcome_2027: string | null
          q_focus: string[]
          status: string
          target: number | null
          target_note: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          baseline?: number | null
          category: string
          created_at?: string
          current?: number | null
          id?: string
          kpi_name?: string | null
          kpi_unit?: string | null
          notes?: string | null
          number: number
          outcome_2027?: string | null
          q_focus?: string[]
          status?: string
          target?: number | null
          target_note?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          baseline?: number | null
          category?: string
          created_at?: string
          current?: number | null
          id?: string
          kpi_name?: string | null
          kpi_unit?: string | null
          notes?: string | null
          number?: number
          outcome_2027?: string | null
          q_focus?: string[]
          status?: string
          target?: number | null
          target_note?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ideas: {
        Row: {
          area: string | null
          created_at: string
          id: string
          promoted_asset_id: string | null
          revisit_on: string | null
          title: string
          updated_at: string
          user_id: string
          why_parked: string | null
        }
        Insert: {
          area?: string | null
          created_at?: string
          id?: string
          promoted_asset_id?: string | null
          revisit_on?: string | null
          title: string
          updated_at?: string
          user_id?: string
          why_parked?: string | null
        }
        Update: {
          area?: string | null
          created_at?: string
          id?: string
          promoted_asset_id?: string | null
          revisit_on?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          why_parked?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ideas_promoted_asset_id_fkey"
            columns: ["promoted_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_promoted_asset_id_fkey"
            columns: ["promoted_asset_id"]
            isOneToOne: false
            referencedRelation: "v_asset_focus"
            referencedColumns: ["asset_id"]
          },
        ]
      }
      income_entries: {
        Row: {
          amount: number
          amount_ngn: number
          asset_id: string | null
          created_at: string
          currency: string
          description: string | null
          engine: string
          entry_date: string
          fx_used: number | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          amount_ngn?: number
          asset_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          engine: string
          entry_date: string
          fx_used?: number | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          amount_ngn?: number
          asset_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          engine?: string
          entry_date?: string
          fx_used?: number | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_entries_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_entries_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "v_asset_focus"
            referencedColumns: ["asset_id"]
          },
        ]
      }
      investments: {
        Row: {
          cost_basis_ngn: number | null
          created_at: string
          current_value_ngn: number | null
          id: string
          is_liquid: boolean
          last_updated: string | null
          name: string
          platform: string | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_basis_ngn?: number | null
          created_at?: string
          current_value_ngn?: number | null
          id?: string
          is_liquid?: boolean
          last_updated?: string | null
          name: string
          platform?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          cost_basis_ngn?: number | null
          created_at?: string
          current_value_ngn?: number | null
          id?: string
          is_liquid?: boolean
          last_updated?: string | null
          name?: string
          platform?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          body: string | null
          country_id: string | null
          created_at: string
          entry_date: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          country_id?: string | null
          created_at?: string
          entry_date: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          body?: string | null
          country_id?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_readings: {
        Row: {
          created_at: string
          id: string
          kpi_id: string
          note: string | null
          reading_date: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          kpi_id: string
          note?: string | null
          reading_date: string
          updated_at?: string
          user_id?: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          kpi_id?: string
          note?: string | null
          reading_date?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_readings_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_readings_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "v_kpi_latest"
            referencedColumns: ["kpi_id"]
          },
        ]
      }
      kpis: {
        Row: {
          asset_id: string | null
          baseline: number | null
          created_at: string
          direction: string
          goal_id: string | null
          id: string
          name: string
          sort: number
          target: number | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          baseline?: number | null
          created_at?: string
          direction?: string
          goal_id?: string | null
          id?: string
          name: string
          sort?: number
          target?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          asset_id?: string | null
          baseline?: number | null
          created_at?: string
          direction?: string
          goal_id?: string | null
          id?: string
          name?: string
          sort?: number
          target?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpis_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "v_asset_focus"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "kpis_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_items: {
        Row: {
          area: string | null
          created_at: string
          finished: string | null
          id: string
          started: string | null
          status: string
          takeaway: string | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          finished?: string | null
          id?: string
          started?: string | null
          status?: string
          takeaway?: string | null
          title: string
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          area?: string | null
          created_at?: string
          finished?: string | null
          id?: string
          started?: string | null
          status?: string
          takeaway?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_plans: {
        Row: {
          area: string | null
          asset_id: string | null
          created_at: string
          id: string
          money_target_ngn: number | null
          month: string
          notes: string | null
          one_thing: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: string | null
          asset_id?: string | null
          created_at?: string
          id?: string
          money_target_ngn?: number | null
          month: string
          notes?: string | null
          one_thing: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          area?: string | null
          asset_id?: string | null
          created_at?: string
          id?: string
          money_target_ngn?: number | null
          month?: string
          notes?: string | null
          one_thing?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_plans_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_plans_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "v_asset_focus"
            referencedColumns: ["asset_id"]
          },
        ]
      }
      monthly_snapshots: {
        Row: {
          business_equity_ngn: number | null
          cash_ngn: number | null
          created_at: string
          fx_ngn_per_usd: number | null
          id: string
          illiquid_investments_ngn: number | null
          liabilities_ngn: number | null
          liquid_investments_ngn: number | null
          month: string
          notes: string | null
          other_assets_ngn: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_equity_ngn?: number | null
          cash_ngn?: number | null
          created_at?: string
          fx_ngn_per_usd?: number | null
          id?: string
          illiquid_investments_ngn?: number | null
          liabilities_ngn?: number | null
          liquid_investments_ngn?: number | null
          month: string
          notes?: string | null
          other_assets_ngn?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          business_equity_ngn?: number | null
          cash_ngn?: number | null
          created_at?: string
          fx_ngn_per_usd?: number | null
          id?: string
          illiquid_investments_ngn?: number | null
          liabilities_ngn?: number | null
          liquid_investments_ngn?: number | null
          month?: string
          notes?: string | null
          other_assets_ngn?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      option_sets: {
        Row: {
          archived: boolean
          color: string | null
          created_at: string
          id: string
          label: string
          set_key: string
          sort: number
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          archived?: boolean
          color?: string | null
          created_at?: string
          id?: string
          label: string
          set_key: string
          sort?: number
          updated_at?: string
          user_id?: string
          value: string
        }
        Update: {
          archived?: boolean
          color?: string | null
          created_at?: string
          id?: string
          label?: string
          set_key?: string
          sort?: number
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          asset_id: string | null
          created_at: string
          due_date: string | null
          goal_id: string | null
          id: string
          next_milestone: string | null
          notes: string | null
          quarter: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          due_date?: string | null
          goal_id?: string | null
          id?: string
          next_milestone?: string | null
          notes?: string | null
          quarter?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          due_date?: string | null
          goal_id?: string | null
          id?: string
          next_milestone?: string | null
          notes?: string | null
          quarter?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "v_asset_focus"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "projects_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      quarterly_objectives: {
        Row: {
          actual: number | null
          asset_id: string | null
          created_at: string
          goal_id: string | null
          id: string
          kpi_name: string | null
          quarter: string
          starting: number | null
          status: string
          target: number | null
          theme: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual?: number | null
          asset_id?: string | null
          created_at?: string
          goal_id?: string | null
          id?: string
          kpi_name?: string | null
          quarter: string
          starting?: number | null
          status?: string
          target?: number | null
          theme?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          actual?: number | null
          asset_id?: string | null
          created_at?: string
          goal_id?: string | null
          id?: string
          kpi_name?: string | null
          quarter?: string
          starting?: number | null
          status?: string
          target?: number | null
          theme?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quarterly_objectives_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quarterly_objectives_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "v_asset_focus"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "quarterly_objectives_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quarterly_objectives_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          change_next: string | null
          created_at: string
          got_done: string | null
          id: string
          not_done: string | null
          period_end: string
          period_start: string
          score: number | null
          snapshot: Json | null
          type: string
          updated_at: string
          user_id: string
          why: string | null
        }
        Insert: {
          change_next?: string | null
          created_at?: string
          got_done?: string | null
          id?: string
          not_done?: string | null
          period_end: string
          period_start: string
          score?: number | null
          snapshot?: Json | null
          type: string
          updated_at?: string
          user_id?: string
          why?: string | null
        }
        Update: {
          change_next?: string | null
          created_at?: string
          got_done?: string | null
          id?: string
          not_done?: string | null
          period_end?: string
          period_start?: string
          score?: number | null
          snapshot?: Json | null
          type?: string
          updated_at?: string
          user_id?: string
          why?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          base_target_usd: number | null
          connections_target: number | null
          countries_target: number | null
          created_at: string
          end_date: string
          fx_ngn_per_usd: number
          max_active_assets: number
          owner_name: string | null
          seeded_at: string | null
          start_date: string
          stretch_target_usd: number | null
          timezone: string
          updated_at: string
          user_id: string
          week_starts_on: number
        }
        Insert: {
          base_target_usd?: number | null
          connections_target?: number | null
          countries_target?: number | null
          created_at?: string
          end_date?: string
          fx_ngn_per_usd?: number
          max_active_assets?: number
          owner_name?: string | null
          seeded_at?: string | null
          start_date?: string
          stretch_target_usd?: number | null
          timezone?: string
          updated_at?: string
          user_id?: string
          week_starts_on?: number
        }
        Update: {
          base_target_usd?: number | null
          connections_target?: number | null
          countries_target?: number | null
          created_at?: string
          end_date?: string
          fx_ngn_per_usd?: number
          max_active_assets?: number
          owner_name?: string | null
          seeded_at?: string | null
          start_date?: string
          stretch_target_usd?: number | null
          timezone?: string
          updated_at?: string
          user_id?: string
          week_starts_on?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          asset_id: string | null
          carried_from: string | null
          created_at: string
          done_at: string | null
          id: string
          import_key: string | null
          is_top3: boolean
          kind: string
          kind_overridden: boolean
          links: string[]
          notes: string | null
          priority: string
          project_id: string | null
          source: string
          status: string
          status_note: string | null
          task_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          carried_from?: string | null
          created_at?: string
          done_at?: string | null
          id?: string
          import_key?: string | null
          is_top3?: boolean
          kind?: string
          kind_overridden?: boolean
          links?: string[]
          notes?: string | null
          priority?: string
          project_id?: string | null
          source?: string
          status?: string
          status_note?: string | null
          task_date?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          asset_id?: string | null
          carried_from?: string | null
          created_at?: string
          done_at?: string | null
          id?: string
          import_key?: string | null
          is_top3?: boolean
          kind?: string
          kind_overridden?: boolean
          links?: string[]
          notes?: string | null
          priority?: string
          project_id?: string | null
          source?: string
          status?: string
          status_note?: string | null
          task_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "v_asset_focus"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "tasks_carried_from_fkey"
            columns: ["carried_from"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_plans: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          one_thing: string | null
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          one_thing?: string | null
          updated_at?: string
          user_id?: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          one_thing?: string | null
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      weekly_priorities: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          notes: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
          week_start: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_priorities_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_priorities_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "v_asset_focus"
            referencedColumns: ["asset_id"]
          },
        ]
      }
    }
    Views: {
      v_asset_focus: {
        Row: {
          asset_id: string | null
          attention: string | null
          current_quarter: string | null
          missing_one_thing: boolean | null
          name: string | null
          one_thing: string | null
          one_thing_status: string | null
          open_tasks_this_week: number | null
          parent_id: string | null
          quarterly_objective_id: string | null
          too_many_tasks: boolean | null
          user_id: string | null
          week_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_asset_focus"
            referencedColumns: ["asset_id"]
          },
        ]
      }
      v_capital_monthly: {
        Row: {
          business_equity_ngn: number | null
          cash_ngn: number | null
          expenses_ngn: number | null
          fx_ngn_per_usd: number | null
          has_snapshot: boolean | null
          illiquid_investments_ngn: number | null
          income_by_engine: Json | null
          income_ngn: number | null
          is_carried_forward: boolean | null
          is_future: boolean | null
          liabilities_ngn: number | null
          liquid_capital_ngn: number | null
          liquid_capital_usd: number | null
          liquid_change_ngn: number | null
          liquid_change_usd: number | null
          liquid_investments_ngn: number | null
          month: string | null
          net_savings_ngn: number | null
          net_worth_ngn: number | null
          net_worth_usd: number | null
          other_assets_ngn: number | null
          pct_base_target: number | null
          pct_stretch_target: number | null
          quarter: string | null
          savings_rate: number | null
          snapshot_month: string | null
          user_id: string | null
        }
        Relationships: []
      }
      v_goal_progress: {
        Row: {
          baseline: number | null
          category: string | null
          created_at: string | null
          current: number | null
          id: string | null
          kpi_name: string | null
          kpi_unit: string | null
          notes: string | null
          number: number | null
          outcome_2027: string | null
          progress: number | null
          q_focus: string[] | null
          status: string | null
          target: number | null
          target_note: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          baseline?: number | null
          category?: string | null
          created_at?: string | null
          current?: number | null
          id?: string | null
          kpi_name?: string | null
          kpi_unit?: string | null
          notes?: string | null
          number?: number | null
          outcome_2027?: string | null
          progress?: never
          q_focus?: string[] | null
          status?: string | null
          target?: number | null
          target_note?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          baseline?: number | null
          category?: string | null
          created_at?: string | null
          current?: number | null
          id?: string | null
          kpi_name?: string | null
          kpi_unit?: string | null
          notes?: string | null
          number?: number | null
          outcome_2027?: string | null
          progress?: never
          q_focus?: string[] | null
          status?: string | null
          target?: number | null
          target_note?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_kpi_latest: {
        Row: {
          asset_id: string | null
          baseline: number | null
          direction: string | null
          effective_baseline: number | null
          goal_id: string | null
          kpi_id: string | null
          latest_date: string | null
          latest_note: string | null
          latest_reading_id: string | null
          latest_value: number | null
          name: string | null
          progress: number | null
          reading_count: number | null
          sort: number | null
          target: number | null
          unit: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpis_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "v_asset_focus"
            referencedColumns: ["asset_id"]
          },
          {
            foreignKeyName: "kpis_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "v_goal_progress"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      app_today: { Args: { p_user?: string }; Returns: string }
      assert_same_owner: {
        Args: { p_id: string; p_table: unknown; p_user: string }
        Returns: undefined
      }
      bootstrap_user: { Args: never; Returns: Json }
      default_task_kind: { Args: { p_asset_id: string }; Returns: string }
      kill_asset: {
        Args: {
          p_asset_id: string
          p_decided_on?: string
          p_options?: string
          p_outcome?: string
          p_reasoning: string
          p_review_on?: string
          p_title?: string
        }
        Returns: string
      }
      program_quarter:
        | { Args: { p_date: string }; Returns: string }
        | {
            Args: { p_date: string; p_end: string; p_start: string }
            Returns: string
          }
      seed_user_data: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

