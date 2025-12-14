from flask import Flask, render_template, jsonify
from pathlib import Path

import pandas as pd

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/executive-summary')
def executive_summary():
    return render_template('executive_summary_report.html')

@app.route('/digital-performance-report')
def digital_performance_report():
    return render_template('digital_performance_report.html')

@app.route('/media-performance-report')
def media_performance_report():
    return render_template('media_performance_report.html')

@app.route('/media-image-report')
def media_image_report():
    return render_template('media_image_report.html')

@app.route('/full-report-pdf')
def full_report_pdf():
    return render_template('full_report_pdf.html')

@app.route('/api/data')
def get_data():
    # Placeholder for Python data processing
    # In the future, this can read from the 'data' directory or a database
    sample_data = {
        "awareness_level": 75,
        "region": "Gulf",
        "message": "Data served from Python backend"
    }
    return jsonify(sample_data)


@app.route('/api/news-mentions')
def get_news_mentions():
    data_path = Path(app.root_path) / 'data' / 'mentions_trend.csv'

    if not data_path.exists():
        return jsonify({"error": "mentions data not found"}), 404

    df = pd.read_csv(data_path, parse_dates=['Date'])
    df.sort_values('Date', inplace=True)

    topics_path = Path(app.root_path) / 'data' / 'fromawqaf_ksa.csv'
    top_topics = []
    top_newspapers = []
    if topics_path.exists():
        try:
            topics_df = pd.read_csv(topics_path, sep='\t', dtype=str)
            total_items = len(topics_df.index)
            keyphrase_counts: dict[str, int] = {}

            keyphrase_series = topics_df['Keyphrases'] if 'Keyphrases' in topics_df else pd.Series(dtype=str)

            for raw_value in keyphrase_series.dropna():
                phrases = {phrase.strip() for phrase in str(raw_value).split(';') if phrase.strip()}
                for cleaned in phrases:
                    if ' ' not in cleaned:
                        continue
                    if 'الأوقاف' in cleaned:
                        continue
                    if cleaned.endswith('الأوقاف') or cleaned.endswith('للأوقاف'):
                        continue
                    keyphrase_counts[cleaned] = keyphrase_counts.get(cleaned, 0) + 1

            sorted_topics = sorted(
                keyphrase_counts.items(), key=lambda item: item[1], reverse=True
            )[:6]

            topic_label_overrides = {
                'ضيوف الرحمن': 'خدمة ضيوف الرحمن والحج',
                'لضيوف الرحمن': 'خدمات ميدانية لضيوف الرحمن',
                'الفقهية الوقفية': 'الندوة الفقهية الوقفية الثانية',
                'مذكرة تفاهم': 'مذكرات التفاهم والشراكات الجديدة',
                'الملكي الأمير': 'رعاية قيادات الدولة للبرامج الوقفية',
                'حوارية بعنوان': 'الحوارات والندوات التوعوية',
                'التنظيمية للقطاع': 'التشريعات والتنظيمات للقطاع الوقفي',
                'عالية الأثر': 'برامج عالية الأثر المجتمعي',
                'الربحي وتعزيز': 'تمكين القطاع غير الربحي',
            }

            for label, count in sorted_topics:
                display_label = topic_label_overrides.get(label, label)
                percentage = round((count / total_items) * 100, 1) if total_items else 0.0
                top_topics.append(
                    {
                        "label": display_label,
                        "count": int(count),
                        "percentage": percentage,
                    }
                )
        except Exception:
            top_topics = []

    press_path = Path(app.root_path) / 'data' / 'press_mentions.csv'
    if press_path.exists():
        try:
            press_df = pd.read_csv(
                press_path,
                usecols=[
                    'Date',
                    'Source Name',
                    'Source Domain',
                    'Title',
                    'URL',
                    'Reach',
                    'Sentiment',
                    'Keyphrases',
                ],
                dtype=str,
                sep='\t',
                encoding='utf-16',
            )

            press_df = press_df.dropna(subset=['Source Name']).copy()
            press_df['Source Name'] = press_df['Source Name'].str.strip()
            press_df['Source Domain'] = press_df['Source Domain'].fillna('').str.strip()
            press_df['Title'] = press_df['Title'].fillna('').str.strip()
            press_df['URL'] = press_df['URL'].fillna('').str.strip()
            press_df['Sentiment'] = press_df['Sentiment'].fillna('').str.strip().str.lower()

            press_df['Date'] = pd.to_datetime(press_df['Date'], errors='coerce')

            reach_clean = (
                press_df['Reach']
                .fillna('0')
                .astype(str)
                .str.replace(',', '', regex=False)
                .str.replace(' ', '', regex=False)
                .str.replace('\u00a0', '', regex=False)
            )
            press_df['ReachValue'] = pd.to_numeric(reach_clean, errors='coerce').fillna(0)

            aggregated = (
                press_df.groupby(['Source Name', 'Source Domain'], as_index=False)
                .agg(
                    mentions=('Title', 'count'),
                    total_reach=('ReachValue', 'sum'),
                )
            )

            aggregated = aggregated.rename(
                columns={'Source Name': 'source_name', 'Source Domain': 'source_domain'}
            )

            aggregated = aggregated.sort_values(
                ['total_reach', 'mentions'], ascending=[False, False]
            ).head(10)

            topic_label_overrides_press = {
                'ضيوف الرحمن': 'خدمة ضيوف الرحمن والحج',
                'لضيوف الرحمن': 'خدمات ميدانية لضيوف الرحمن',
                'الفقهية الوقفية': 'الندوة الفقهية الوقفية الثانية',
                'مذكرة تفاهم': 'مذكرات التفاهم والشراكات الجديدة',
                'الملكي الأمير': 'رعاية قيادات الدولة للبرامج الوقفية',
                'حوارية بعنوان': 'الحوارات والندوات التوعوية',
                'التنظيمية للقطاع': 'التشريعات والتنظيمات للقطاع الوقفي',
                'عالية الأثر': 'برامج عالية الأثر المجتمعي',
                'الربحي وتعزيز': 'تمكين القطاع غير الربحي',
            }

            fallback_logo = '/static/images/icon.png'

            for row in aggregated.itertuples(index=False):
                outlet_mask = (
                    (press_df['Source Name'] == row.source_name)
                    & (press_df['Source Domain'] == row.source_domain)
                )
                outlet_entries = press_df.loc[outlet_mask].copy()

                if outlet_entries.empty:
                    continue

                outlet_entries = outlet_entries.sort_values(
                    ['ReachValue', 'Date'], ascending=[False, False]
                )
                latest_date = outlet_entries['Date'].max()

                logo_domain = row.source_domain or ''
                logo_url = (
                    f"https://logo.clearbit.com/{logo_domain}"
                    if logo_domain
                    else fallback_logo
                )

                topic_counts: dict[str, int] = {}
                keyphrase_series = outlet_entries.get('Keyphrases', pd.Series(dtype=str))
                for raw_value in keyphrase_series.dropna():
                    phrases = {
                        phrase.strip()
                        for phrase in str(raw_value).split(';')
                        if phrase.strip()
                    }
                    for cleaned in phrases:
                        if ' ' not in cleaned:
                            continue
                        if 'الأوقاف' in cleaned:
                            continue
                        if cleaned.endswith('الأوقاف') or cleaned.endswith('للأوقاف'):
                            continue
                        topic_counts[cleaned] = topic_counts.get(cleaned, 0) + 1

                sorted_topics = sorted(
                    topic_counts.items(), key=lambda item: item[1], reverse=True
                )

                top_topics_outlet = []
                total_mentions = int(row.mentions) if row.mentions else 0
                for label, count in sorted_topics[:3]:
                    display_label = topic_label_overrides_press.get(label, label)
                    percentage = (
                        round((count / total_mentions) * 100, 1)
                        if total_mentions
                        else 0.0
                    )
                    top_topics_outlet.append(
                        {
                            "label": display_label,
                            "count": int(count),
                            "percentage": percentage,
                        }
                    )

                top_newspapers.append(
                    {
                        "name": row.source_name,
                        "domain": row.source_domain,
                        "mentions": int(row.mentions),
                        "total_reach": int(round(row.total_reach)),
                        "latest_date": (
                            latest_date.strftime('%Y-%m-%d')
                            if pd.notna(latest_date)
                            else ''
                        ),
                        "logo_url": logo_url,
                        "top_topics": top_topics_outlet,
                    }
                )
        except Exception:
            top_newspapers = []

    peak_annotations = {
        '2024-12-25': {
            'title': 'شرعية الإنجاز: متحف القرآن الدولي',
            'description': 'الصحافة وثقت أرقام الزوار والشراكات الثقافية مع افتتاح متحف القرآن وما يحمله من رمزية للهوية السعودية.'
        },
        '2024-12-30': {
            'title': 'حصاد نهاية العام الوقفي',
            'description': 'تقارير موسعة عن أداء الصناديق الوقفية وإعلانات الحوكمة التي أظهرت قوة الأثر التنموي للهيئة.'
        },
        '2025-01-23': {
            'title': 'حزمة الأنظمة الجديدة للقطاع الوقفي',
            'description': 'الصحف ركزت على اللوائح التنظيمية التي عززت حماية الأصول ورفعت كفاءة إدارة الأوقاف.'
        },
        '2025-02-06': {
            'title': 'ملتقى نمو للاستثمار الوقفي',
            'description': 'تغطية اقتصادية موسعة عرضت فرص الاستثمار الوقفي ومشروعات الشراكة مع القطاع الخاص.'
        },
        '2025-08-11': {
            'title': 'انطلاقة حملة #أوقفها_للأبد',
            'description': 'الصحافة سلطت الضوء على السردية الجديدة التي قدمتها الحملة لتحويل الوقف إلى قصة أثر مستدام.'
        },
        '2025-08-12': {
            'title': 'ذروة التفاعل مع حملة #أوقفها_للأبد',
            'description': 'المحتوى التحفيزي للحملة امتد إلى صفحات الصحف مع قصص للواقفين الجدد وشراكات التأثير المجتمعي.'
        },
        '2025-10-18': {
            'title': 'تتويج عالمي في موسم الجوائز',
            'description': 'مادة صحفية غنية عن دخول الهيئة موسوعة غينيس وشهادات الاعتماد الدولية لبرامجها.'
        }
    }

    series = [
        {"date": row.Date.strftime('%Y-%m-%d'), "count": int(row.Count)}
        for row in df.itertuples(index=False)
    ]

    total_mentions = int(df['Count'].sum())
    daily_average = float(df['Count'].mean())
    coverage_days = int((df['Count'] > 0).sum())
    zero_days = int((df['Count'] == 0).sum())
    high_intensity_days = int((df['Count'] >= 15).sum())

    longest_zero_streak = 0
    current_streak = 0
    for value in df['Count']:
        if value == 0:
            current_streak += 1
            longest_zero_streak = max(longest_zero_streak, current_streak)
        else:
            current_streak = 0

    month_names = {
        1: "يناير",
        2: "فبراير",
        3: "مارس",
        4: "أبريل",
        5: "مايو",
        6: "يونيو",
        7: "يوليو",
        8: "أغسطس",
        9: "سبتمبر",
        10: "أكتوبر",
        11: "نوفمبر",
        12: "ديسمبر",
    }

    top_peaks = (
        df.sort_values('Count', ascending=False)
        .head(5)
        .sort_values('Date')
    )

    peak_events = [
        {
            "date": row.Date.strftime('%Y-%m-%d'),
            "label": f"{row.Date.day} {month_names[row.Date.month]} {row.Date.year}",
            "count": int(row.Count),
            "title": peak_annotations.get(row.Date.strftime('%Y-%m-%d'), {}).get('title', 'قمة تغطية صحفية'),
            "description": peak_annotations.get(row.Date.strftime('%Y-%m-%d'), {}).get(
                'description',
                'أعلى عدد من الأخبار المرتبطة بمبادرات الهيئة في هذا اليوم.'
            ),
        }
        for row in top_peaks.itertuples(index=False)
    ]

    monthly_totals = (
        df.groupby([df['Date'].dt.year, df['Date'].dt.month])['Count']
        .sum()
        .sort_values(ascending=False)
        .head(4)
    )

    top_months = []
    for (year, month), count in monthly_totals.items():
        top_months.append(
            {
                "label": f"{month_names[month]} {year}",
                "count": int(count),
            }
        )

    summary = {
        "total_mentions": total_mentions,
        "total_formatted": f"{total_mentions/1000:.2f} ألف" if total_mentions >= 1000 else str(total_mentions),
        "daily_average": daily_average,
        "daily_average_formatted": f"{daily_average:.1f}",
        "coverage_days": coverage_days,
        "zero_days": zero_days,
        "high_intensity_days": high_intensity_days,
        "longest_zero_streak": longest_zero_streak,
    }

    return jsonify(
        {
            "series": series,
            "summary": summary,
            "top_peaks": peak_events,
            "top_months": top_months,
            "top_topics": top_topics,
            "top_newspapers": top_newspapers,
        }
    )

if __name__ == '__main__':
    app.run(debug=True, port=5001)
