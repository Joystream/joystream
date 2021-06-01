#![cfg(feature = "plot")]
use crate::state_sizes::KUSAMA_STATE_DISTRIBUTION;
use linregress::RegressionModel;
use plotters::prelude::*;
use std::convert::TryFrom;

pub fn plot_points(
    name: String,
    series: Vec<Vec<(usize, std::time::Duration)>>,
    bench_avg: u64,
    sd: f64,
    model: RegressionModel,
) {
    let open_image_time = std::time::Instant::now();
    let plot_name = format!("{}.png", name);
    let root = BitMapBackend::new(&plot_name, (1920, 1080)).into_drawing_area();

    root.fill(&WHITE).unwrap();

    log::info!(
        "Open image time: {}ms",
        open_image_time.elapsed().as_millis()
    );

    let get_limits_time = std::time::Instant::now();
    let series_iter = series
        .into_iter()
        .flatten()
        .map(|(size, val)| (size, f64::from(u32::try_from(val.as_micros()).unwrap())));

    let max_x = series_iter
        .clone()
        .map(|(x, _)| x)
        .max()
        .expect("Series shouldn't be empty");

    let max_y = series_iter
        .clone()
        .map(|(_, y)| y)
        .max_by(|x, y| x.partial_cmp(y).expect("No value should be None"))
        .expect("Series shouldn't be empty");

    log::info!(
        "Get limits time: {}ms",
        get_limits_time.elapsed().as_millis()
    );

    let max_avg_y = f64::from(u32::try_from(bench_avg).unwrap()) + sd;
    let max_y = max_avg_y.max(max_y);

    let create_chart_time = std::time::Instant::now();
    let x_range = 0usize..max_x;

    let mut chart = ChartBuilder::on(&root)
        .caption(name, ("sans-serif", 30))
        .margin(40)
        .y_label_area_size(100)
        .x_label_area_size(80)
        .build_cartesian_2d(x_range.clone(), 0f64..max_y)
        .unwrap();

    log::info!(
        "Create chart time: {}ms",
        create_chart_time.elapsed().as_millis()
    );

    let prepare_graph_time = std::time::Instant::now();
    chart
        .configure_mesh()
        .x_labels(30)
        .y_desc("Time(ms)")
        .x_desc("Entry size(B)")
        .axis_desc_style(("sans-serif", 25))
        .x_label_style(("sans-serif", 25))
        .y_label_style(("sans-serif", 25))
        .draw()
        .unwrap();

    log::info!(
        "Prepare time: {}ms",
        prepare_graph_time.elapsed().as_millis()
    );

    let graph_time = std::time::Instant::now();

    chart
        .draw_series(series_iter.map(|point| Circle::new(point, 5, &BLUE)))
        .unwrap()
        .label("Raw Benchmark Data")
        .legend(|(x, y)| PathElement::new(vec![(x, y), (x + 20, y)], &BLUE));

    chart
        .draw_series(vec![Rectangle::new(
            [
                (0, (f64::from(u32::try_from(bench_avg).unwrap()) + sd)),
                (max_x, (f64::from(u32::try_from(bench_avg).unwrap()) - sd)),
            ],
            GREEN.mix(0.5).filled(),
        )])
        .unwrap()
        .label("Standard Benchmark data")
        .legend(|(x, y)| PathElement::new(vec![(x, y), (x + 20, y)], &GREEN));

    let x_range_f64 = x_range
        .clone()
        .map(|x| f64::from(u32::try_from(x).unwrap()));
    chart
        .draw_series(LineSeries::new(
            x_range.zip(model.predict(vec![("X", x_range_f64.collect())]).unwrap()),
            &RED,
        ))
        .unwrap()
        .label("Linear regression")
        .legend(|(x, y)| PathElement::new(vec![(x, y), (x + 20, y)], &RED));

    chart
        .configure_series_labels()
        .background_style(WHITE.filled())
        .label_font(("sans-serif", 25))
        .position(SeriesLabelPosition::UpperLeft)
        .draw()
        .unwrap();

    log::info!("Graph time: {}ms", graph_time.elapsed().as_millis());
}

pub fn plot_hist() {
    let root = BitMapBackend::new("state_dist.png", (1920, 1080)).into_drawing_area();

    root.fill(&WHITE).unwrap();

    let max_count = KUSAMA_STATE_DISTRIBUTION
        .iter()
        .map(|(_, y)| y)
        .max()
        .unwrap();

    let mut chart = ChartBuilder::on(&root)
        .x_label_area_size(70)
        .y_label_area_size(150)
        .margin(80)
        .caption("State distribution", ("sans-serif", 50))
        .build_cartesian_2d((0u32..9000u32).into_segmented(), 0u32..*max_count)
        .unwrap();

    chart
        .configure_mesh()
        .disable_x_mesh()
        .bold_line_style(&WHITE.mix(0.3))
        .y_desc("Count")
        .x_desc("Size(B)")
        .x_labels(20)
        .x_label_style(("sans-serif", 25))
        .y_label_style(("sans-serif", 25))
        .axis_desc_style(("sans-serif", 25))
        .draw()
        .unwrap();

    chart
        .draw_series(
            Histogram::vertical(&chart)
                .margin(1)
                .style(RED.mix(0.5).filled())
                .data(KUSAMA_STATE_DISTRIBUTION.iter().map(|(x, y)| (*x, *y))),
        )
        .unwrap();
}
