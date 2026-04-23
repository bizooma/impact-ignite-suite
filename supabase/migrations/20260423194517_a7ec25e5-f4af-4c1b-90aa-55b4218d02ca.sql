ALTER TABLE public.accessibility_settings
ADD COLUMN IF NOT EXISTS widget_position text NOT NULL DEFAULT 'right'
CHECK (widget_position IN ('left','center','right'));