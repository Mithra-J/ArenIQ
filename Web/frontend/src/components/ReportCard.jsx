function ReportCard({ report }) {

  return (

    <div className="report">

      <h4>{report.type}</h4>

      <p>{report.location}</p>

      <p>Status: {report.status}</p>

    </div>

  );

}

export default ReportCard;