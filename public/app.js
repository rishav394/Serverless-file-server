class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      success: false,
      url: "",
    };
  }

  handleChange = (ev) => {
    this.setState({ success: false, url: "" });
  };
  // Perform the upload
  handleUpload = (ev) => {
    let file = this.uploadInput.files[0];
    // Split the filename to get the name and type
    let fileParts = this.uploadInput.files[0].name.split(".");
    let fileName = file.name;
    let fileType = fileParts[1];

    axios
      .post("/sign_s3", {
        fileName: fileName,
        fileType: fileType,
      })
      .then((response) => {
        var returnData = response.data.data.returnData;
        var signedRequestUrl = returnData.signedRequest;
        var accessUrl = returnData.url;
        this.setState({ url: accessUrl });

        // Put the fileType in the headers for the upload
        var options = {
          headers: { "Content-Type": fileType, "x-amz-acl": "public-read" },
        };

        axios
          .put(signedRequestUrl, file, options)
          .then((result) => {
            this.setState({ success: true });
          })
          .catch((error) => {
            alert(JSON.stringify(error));
          });
      })
      .catch((error) => {
        alert(JSON.stringify(error));
      });
  };

  render() {
    const Success_message = () => (
      <div style={{ padding: 50 }}>
        <h3 style={{ color: "green" }}>SUCCESSFUL UPLOAD</h3>
        <a href={this.state.url}>Access the file here</a>
        <br />
      </div>
    );
    return (
      <div className="App">
        <center>
          <h1>UPLOAD A FILE</h1>
          {this.state.success ? <Success_message /> : null}
          <input
            onChange={this.handleChange}
            ref={(ref) => {
              this.uploadInput = ref;
            }}
            type="file"
          />
          <br />
          <button onClick={this.handleUpload}>UPLOAD</button>
        </center>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("mydiv"));
