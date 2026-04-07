# הוראות לסשן

## Git workflow — חובה בכל סיום עבודה

1. **Push** לסיום כל משימה:
   ```
   git add .
   git commit -m "תיאור השינוי"
   git push origin claude/hebrew-iptv-player-szWb2
   ```

2. **PR** — אחרי כל push, צור Pull Request אוטומטית:
   - owner: `edenkony`
   - repo: `Streaming`
   - head: `claude/hebrew-iptv-player-szWb2`
   - base: `main`
   - אם PR כבר קיים לאותו branch — אל תיצור כפילות

3. **סיכום** — בסוף כל שינוי, כתוב סיכום בפורמט copy-paste לסוכן.

## פרויקט: IPTV ישראל
- מיקום: `/home/user/Streaming/iptv-app`
- Branch: `claude/hebrew-iptv-player-szWb2`
- פריסה: GitHub Pages (`https://edenkony.github.io/Streaming/`)
- Supabase URL: `https://joesdlabrchhyafzovaa.supabase.co`
