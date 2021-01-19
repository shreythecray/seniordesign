import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import Collapse from 'react-bootstrap/Collapse';
import { Helmet } from 'react-helmet';
import 'semantic-ui-css/semantic.min.css';
import { Button, Form, Grid, Header, Message, Segment, Menu, Container, Dropdown, Loader } from 'semantic-ui-react';

// userContext stores the logged in user's info to use in REST calls
const userContext = React.createContext({ email: "", id: "" });

const ratingOptions = [
  { text: '1 (completely irrelevant)', value: '1' },
  { text: '2', value: '2' },
  { text: '3', value: '3' },
  { text: '4', value: '4' },
  { text: '5', value: '5' },
  { text: '6', value: '6' },
  { text: '7', value: '7' },
  { text: '8', value: '8' },
  { text: '9', value: '9' },
  { text: '10 (seminal paper)', value: '10' }
]

/*
* DiseaseSiteDropdown is the menu that shows disease sites
* props: 
*     updateState: a function to propagate the site selection back to the parent
*/
class DiseaseSiteDropdown extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { 
      name: "", 
      rows: [] 
    };
    // fetch the sites and create menu items for each
    fetch('/sites')
      .then(res => res.json())
      .then(sites => {
        var rows: any = [];
        sites.forEach((site: any) => {
          var dropdown =
            <Menu.Item onClick={() => this.update(site.site)} key={site.site} name={site.site}>{site.site}</Menu.Item>
          rows.push(dropdown);
        });
        this.setState({ rows: rows })
      });
  }

  // this function is called when a site is selected
  update(newSite: String) {
    // propagate the change up to the parent
    this.props.updateState(newSite, "");
    // re-fetch and re-render with selected site "active"
    // this could probably be changed to store an array of bools and set the selected site's bool to true then re-render
    fetch('/sites')
      .then(res => res.json())
      .then(sites => {
        var rows: any = [];
        sites.forEach((site: any) => {
          var dropdown =
            <Menu.Item onClick={() => this.update(site.site)} key={site.site} name={site.site} active={newSite == site.site}>{site.site}</Menu.Item>
          rows.push(dropdown);
        });
        this.setState({ name: newSite, rows: rows })
      });
  };

  // initial render
  render() {
    return (
      <div id="DiseaseSiteDropdown" style={{ paddingTop: '10px', paddingBottom: '10px', textAlign: 'center' }}>
        <Menu vertical>
          <Menu.Item header>Disease Site</Menu.Item>
          {this.state.rows}
        </Menu>
      </div>
    )
  }
}

/*
* StagingDropdown is the menu that shows the stages associated with a site
* props: 
*   state:
*     site: the selected disease site
*     stage: the selected stage
*   updateState: a function to propagate the site selection back to the parent
*/
class StagingDropdown extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { 
      name: "", 
      rows: [] 
    };
  }

  update(newStage: any) {
    // propagate the change up to the parent
    this.props.updateState(this.props.state.site, newStage.stage)
    // re-fetch and re-render with selected site "active"
    // this could probably be changed to store an array of bools and set the selected site's bool to true then re-render
    fetch('/stages/' + this.props.state.site)
      .then(res => res.json())
      .then(stages => {
        var rows: any = [];
        stages.forEach((stage: any) => {
          var dropdown = <Menu.Item onClick={() => this.update(stage)} key={stage.stage} name={stage.stage} active={newStage.stage == stage.stage}>{stage.stage}</Menu.Item>
          rows.push(dropdown);
        });
        this.setState({ name: newStage.stage, rows: rows })
      });
  }

  // this component initially displays nothing, but when a site is selcted this function is called to show the stages
  componentDidUpdate(prevProps: any) {
    if (this.props.state.site != "" && this.props.state.site != prevProps.state.site) {
      fetch('/stages/' + this.props.state.site)
        .then(res => res.json())
        .then(stages => {
          var rows: any = [];
          rows.push()
          stages.forEach((stage: any) => {
            var dropdown = <Menu.Item onClick={() => this.update(stage)} key={stage.stage} name={stage.stage}>{stage.stage}</Menu.Item>
            rows.push(dropdown);
          });
          this.setState({ rows: rows })
          // if the site changes, make sure to reset the stage selection to null
          if (this.props.state.site != prevProps.state.site) this.setState({ name: "" });
        });
    }
  }

  // initially blank on render, changes when site is selected
  render() {
    let content;
    if (this.props.state.site == "") content = <></>;
    else content = <Menu vertical>
      <Menu.Item header>Stage</Menu.Item>
      {this.state.rows}
    </Menu>
    return (
      <div id="StagingDropdown" style={{ paddingTop: '10px', paddingBottom: '10px', textAlign: 'center' }}>
        {content}
      </div>
    )
  }
}
/*
* TreatmentRec displays the treatment recommendations after the site/stage have been selected
* props:
*   state:
*     site: the selected disease site
*     stage: the selected stage
*/
class TreatmentRec extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { 
      recommendation: "" 
    }
  }

  rows: any = []

  // initially the component displays nothing, refreshes when a stage is selected
  componentDidUpdate(prevProps: any) {
    if (prevProps.state.stage != this.props.state.stage) {
      // if a new site is selected reset to show nothing
      if (this.props.state.stage == "") {
        this.rows = [];
        this.setState(this.state);
      }
      // otherwise grab the treatment recommendation and display it
      else {
        fetch(`/recs/${this.props.state.site}/${this.props.state.stage}`)
          .then(res => res.json())
          .then(treatmentStr => {
            var treatments = JSON.parse(treatmentStr[0].treatment);
            this.rows = [];
            this.rows.push(<h2 key="trec">Treatment Recommendation</h2>);
            treatments.forEach((treatment: string) => {
              var par = <p key={treatment}>{treatment}</p>
              this.rows.push(par)
            });
            this.setState(this.state);
          });
      }
    }
  }

  render() {
    return (
      <div id="treatmentRec">
        {this.rows}
      </div>
    )
  }
}

/*
* SuggestPaper shows the Add A Paper interface
* props:
*   state:
*     site: the selected disease site
*     stage: the selected stage
*/
class SuggestPaper extends Component<any, any> {
  // grab the user info
  static contextType = userContext;

  constructor(props: any) {
    super(props);

    this.state = {
      open: false,
      loading: false,
      pmid: '',
      rating: '',
      accepted: false,
      declined: false
    }

    this.submit = this.submit.bind(this);
    this.update = this.update.bind(this);
  }

  rows: any = [];

  // updates the pmid/rating on change
  update(event: any, value: any) {
    this.setState({ [value.name]: value.value, accepted: false, declined: false });
  }

  // send the paper to the backend
  submit() {
    this.setState({ loading: true, accepted: false, declined: false });
    fetch('/suggestPaper', {
      method: 'POST',
      body: JSON.stringify({
        site: this.props.state.site,
        stage: this.props.state.stage,
        pmid: this.state.pmid,
        rating: this.state.rating,
        user_id: this.context.id
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        // if successful
        if (res.status == 200) this.setState({ loading: false, accepted: true })
        // if there was an error
        else if (res.status == 406) {
          this.setState({ loading: false, declined: true })
        }
      })
  }

  // lots of re-render conditions due to several parts only displaying conditionally
  componentDidUpdate(prevProps: any, prevState: any) {
    if (prevProps.state.stage != this.props.state.stage || prevState.open != this.state.open || prevState.loading != this.state.loading || prevState.accepted != this.state.accepted || prevState.declined != this.state.declined) {
      // if there's a new state go back to showing nothing, reset the state variables
      if (prevProps.state.stage != this.props.state.stage) {
        this.rows = [];
        this.setState({ open: false,
          loading: false,
          pmid: '',
          rating: '',
          accepted: false,
          declined: false });
      }
      // if there is a state selected show the form
      if (this.props.state.stage != "") {
        this.rows = [];
        this.rows.push(
          <h2 key="papers" style={{ display: 'inline-block' }}>Add A Paper</h2>,
          <Button key="rel-expand" onClick={() => {this.setState({ open: !this.state.open })}} size='mini' compact style={{ marginLeft: '10px', marginTop: '-15px' }}>{this.state.open ? '-' : '+'}</Button>,
          <Collapse key="rel-lit-col" in={this.state.open}>
            <div id="suggest-col">
              <Form>
                <Form.Group widths='equal'>
                  <Form.Input fluid label='Pubmed ID' name='pmid' placeholder='Pubmed ID' onChange={this.update} />
                  <Form.Select fluid label='Rating' options={ratingOptions} name='rating' placeholder='Rating' onChange={this.update} />

                </Form.Group>
                <Form.Button onClick={this.submit}>Submit</Form.Button>
                <Loader inline active={this.state.loading}>Adding...</Loader>
                <Message positive hidden={!this.state.accepted}>Paper added!</Message>
                <Message negative hidden={!this.state.declined}>Paper error: This PubmedID is invalid or paper is already in database</Message>
              </Form>
            </div>
          </Collapse>
        )
        this.setState(this.state);
      }
    }
  }

  render() {
    return (
      <div id="suggest-paper">
        {this.rows}
      </div>
    )
  }
}

/*
* FavoritePapers shows the Saved Papers menu
* Very similar to RatedPapers and NewPapers
* props:
*   state:
*     site: the selected disease site
*     stage: the selected stage
*/
class FavoritePapers extends Component<any, any> {
  // grab user info
  static contextType = userContext;

  constructor(props: any) {
    super(props);

    this.state = {
      papers: "",
      open: false,
      expanded: {},
      rerender: false,
      fave: {}
    };

    this.updateRating = this.updateRating.bind(this);
    this.submitRating = this.submitRating.bind(this);
    this.unfavePaper = this.unfavePaper.bind(this);
  }

  rows: any = [];
  expanded: any = {};
  ratings: any = {};

  // called when a rating is selected
  updateRating(event: any, value: any) {
    const id = value.name;

    this.ratings[id] = value.value;
  }

  // submits the rating to backend
  submitRating(event: any, rated: any) {
    const target = event.target;
    const pid = target.name;

    // first check if the paper has a rating, if not then call addRating since this is a new rating
    if (rated == "Unrated") {
      fetch('/addRating', {
        method: 'POST',
        body: JSON.stringify({ paper_id: pid, user_id: this.context.id, rating: this.ratings[pid], site: this.props.state.site, stage: this.props.state.stage }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // if it does have a rating, then we can call updateRating
    else {
      fetch('/updateRating', {
        method: 'POST',
        body: JSON.stringify({ paper_id: pid, user_id: this.context.id, rating: this.ratings[pid], site: this.props.state.site, stage: this.props.state.stage }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // triggers re-render so new rating is shown
    this.setState({ rerender: !this.state.rerender })
    return false;
  }

  // called when a paper is un-starred
  unfavePaper(event: any) {
    const target = event.target
    const pid = target.id
    // send update to backend to update db
    fetch('/unfavePaper', {
      method: 'POST',
      body: JSON.stringify({
        paper_id: pid,
        site: this.props.state.site,
        stage: this.props.state.stage
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // trigger re-render so paper is removed from section
    var faved = { ...this.state.fave };
    faved[pid] = !faved[pid];
    this.setState({ fave: faved })
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    if (prevProps.state.stage != this.props.state.stage || prevState.open != this.state.open || prevState.expanded != this.state.expanded || prevState.rerender != this.state.rerender || prevState.fave != this.state.fave) {
      // if there's a new state go back to showing nothing, reset the state variables
      if (prevProps.state.stage != this.props.state.stage) {
        this.rows = [];
        this.setState({ papers: "",
        open: false,
        expanded: {},
        rerender: false,
        fave: {} });
      }
      // otherwise get the faves
      else {
        fetch(`/getFaves/${this.props.state.site}/${this.props.state.stage}`)
          .then(res => res.json())
          .then(papers => {
            this.rows = [];
            this.ratings = {};
            // fetch returns a Promise so we need to do some crazy stuff here to be able to get the existing rating
            let cards = papers.map((paper: any) => {
              // get the paper's rating
              return fetch(`/getRating/${paper.id}/${this.props.state.site}/${this.props.state.stage}`)
                .then(res => res.json())
                .then(rating => {
                  let paperRating = rating.rating;
                  this.ratings[paper.id] = 1;
                  var card =
                    <Card key={paper.id}>
                      <Card.Header style={{ cursor: 'pointer' }} onClick={() => {
                        // if someone clicks the paper, the corresponding expand bool must be updated and trigger re-render
                        var expand = { ...this.state.expanded };
                        expand[paper.id] = !expand[paper.id];
                        this.setState({ expanded: expand })
                      }}>
                        <b>{paper.title}</b>
                      </Card.Header>
                      <Collapse in={this.state.expanded[paper.id]}>
                        <div id={paper.id}>
                          <Card.Body>
                            <strong>Authors:</strong><i className={this.state.fave[paper.id] ? "far fa-star" : "fas fa-star"} id={paper.id} onClick={this.unfavePaper} style={{ float: 'right', cursor: 'pointer' }} /><br />
                            {paper.authors}<br />
                            <strong>Abstract:</strong><br />
                            {paper.abstract}<br />
                            <strong>DOI:</strong><br />
                            {paper.doi}<br />
                            <strong>Previous rating: {paperRating}</strong>
                            <Form>
                              <Form.Select label='Update rating' placeholder='Rating' options={ratingOptions} name={paper.id} onChange={this.updateRating} />
                              <Button primary href="#" name={paper.id} onClick={(e) => this.submitRating(e, paperRating)}>Submit</Button>
                            </Form>
                          </Card.Body>
                        </div>
                      </Collapse>
                    </Card>
                  return card;
                })
            });
            // more weird Promise stuff
            Promise.all(cards).then(cards => {
              this.rows.push(
                <h2 key="papers" style={{ display: 'inline-block' }}>Saved Papers</h2>,
                <Button key="rel-expand" onClick={() => { this.setState({ open: !this.state.open }) }} size='mini' compact style={{ marginLeft: '10px', marginTop: '-15px' }}>{this.state.open ? '-' : '+'}</Button>,
                <Collapse key="rel-lit-col" in={this.state.open}>
                  <div id="rel-lit-div">
                    {cards}
                  </div>
                </Collapse>,
              )
              // trigger re-render so papers are actually shown
              this.setState(this.state);
            })
          });
      }
    }
  }

  render() {
    return (
      <div id="fave-papers">
        {this.rows}
      </div>
    )
  }
}

/*
* RatedPapers shows the Rated Papers menu
* Very similar to FavoritePapers and NewPapers
* props:
*   state:
*     site: the selected disease site
*     stage: the selected stage
*/
class RatedPapers extends Component<any, any> {
  // grab user info
  static contextType = userContext;

  constructor(props: any) {
    super(props);

    this.state = {
      papers: "",
      open: false,
      expanded: {},
      rerender: false,
      fave: {}
    };

    this.updateRating = this.updateRating.bind(this);
    this.submitRating = this.submitRating.bind(this);
    this.favePaper = this.favePaper.bind(this);
  }

  rows: any = [];
  expanded: any = {};
  ratings: any = {};

  // called when a rating is selected
  updateRating(event: any, value: any) {
    const id = value.name;

    this.ratings[id] = value.value;
  }

  // submits the rating to backend
  submitRating(event: any) {
    const target = event.target;
    const pid = target.name;

    fetch('/updateRating', {
      method: 'POST',
      body: JSON.stringify({ paper_id: pid, user_id: this.context.id, rating: this.ratings[pid], site: this.props.state.site, stage: this.props.state.stage }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    // triggers re-render so new rating is shown
    this.setState({ rerender: !this.state.rerender })
    return false;
  }

  // called when a paper is starred
  favePaper(event: any) {
    const target = event.target
    const pid = target.id
    // send update to backend to update db
    fetch('/favePaper', {
      method: 'POST',
      body: JSON.stringify({
        paper_id: pid,
        site: this.props.state.site,
        stage: this.props.state.stage
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // trigger re-render so paper is removed from section
    var faved = { ...this.state.fave };
    faved[pid] = !faved[pid];
    this.setState({ fave: faved })
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    if (prevProps.state.stage != this.props.state.stage || prevState.open != this.state.open || prevState.expanded != this.state.expanded || prevState.rerender != this.state.rerender || prevState.fave != this.state.fave) {
      // if there's a new state go back to showing nothing, reset the state variables
      if (prevProps.state.stage != this.props.state.stage) {
        this.rows = [];
        this.setState({ papers: "",
        open: false,
        expanded: {},
        rerender: false,
        fave: {} });
      }
      // otherwise get the rated papers
      else {
        fetch(`/ratedpapers/${this.props.state.site}/${this.props.state.stage}`)
          .then(res => res.json())
          .then(papers => {
            this.rows = [];
            this.ratings = {};
            // fetch returns a Promise so we need to do some crazy stuff here to be able to get the existing rating
            let cards = papers.map((paper: any) => {
              return fetch(`/getRating/${paper.id}/${this.props.state.site}/${this.props.state.stage}`)
                .then(res => res.json())
                .then(rating => {
                  let paperRating = rating.rating;
                  this.ratings[paper.id] = 1;
                  var card =
                    <Card key={paper.id}>
                      <Card.Header style={{ cursor: 'pointer' }} onClick={() => {
                        // if someone clicks the paper, the corresponding expand bool must be updated and trigger re-render
                        var expand = { ...this.state.expanded };
                        expand[paper.id] = !expand[paper.id];
                        this.setState({ expanded: expand })
                      }}>
                        <b>{paper.title}</b>
                      </Card.Header>
                      <Collapse in={this.state.expanded[paper.id]}>
                        <div id={paper.id}>
                          <Card.Body>
                            <strong>Authors:</strong><i className={this.state.fave[paper.id] ? "fas fa-star" : "far fa-star"} id={paper.id} onClick={this.favePaper} style={{ float: 'right', cursor: 'pointer' }} /><br />
                            {paper.authors}<br />
                            <strong>Abstract:</strong><br />
                            {paper.abstract}<br />
                            <strong>DOI:</strong><br />
                            {paper.doi}<br />
                            <strong>Previous rating: {paperRating}</strong>
                            <Form>
                              <Form.Select label='Update rating' placeholder='Rating' options={ratingOptions} name={paper.id} onChange={this.updateRating} />
                              <Button primary href="#" name={paper.id} onClick={this.submitRating}>Submit</Button>
                            </Form>
                          </Card.Body>
                        </div>
                      </Collapse>
                    </Card>
                  return card;
                })
            });
            // more weird Promise stuff
            Promise.all(cards).then(cards => {
              console.log(cards);
              this.rows.push(
                <h2 key="papers" style={{ display: 'inline-block' }}>Rated Papers</h2>,
                <Button key="rel-expand" onClick={() => { console.log(this.state.open); this.setState({ open: !this.state.open }) }} size='mini' compact style={{ marginLeft: '10px', marginTop: '-15px' }}>{this.state.open ? '-' : '+'}</Button>,
                <Collapse key="rel-lit-col" in={this.state.open}>
                  <div id="rel-lit-div">
                    {cards}
                  </div>
                </Collapse>,
              )
              // trigger re-render so papers are actually shown
              this.setState(this.state);
            })
          });
      }
    }
  }

  render() {
    return (
      <div id="rated-papers">
        {this.rows}
      </div>
    )
  }
}

/*
* NewPapers shows the New Recommendations menu
* Very similar to RatedPapers and FavoritePapers
* props:
*   state:
*     site: the selected disease site
*     stage: the selected stage
*/
class NewPapers extends Component<any, any> {
  // grab user info
  static contextType = userContext;

  constructor(props: any) {
    super(props);
    this.state = {
      papers: "",
      open: false,
      expanded: {},
      fave: {}
    }

    this.updateRating = this.updateRating.bind(this);
    this.submitRating = this.submitRating.bind(this);
    this.refreshModel = this.refreshModel.bind(this);
    this.favePaper = this.favePaper.bind(this);
  }

  rows: any = [];
  expanded: any = {};
  ratings: any = {};

  // called when a rating is selected
  updateRating(event: any, value: any) {
    const id = value.name;

    this.ratings[id] = value.value;
  }

  // submits the rating to backend
  submitRating(event: any) {
    const target = event.target;
    const pid = target.name;

    // delete the corresponding expansion variable
    var expand = { ...this.state.expanded };
    delete expand[pid];

    fetch('/addRating', {
      method: 'POST',
      body: JSON.stringify({ paper_id: pid, user_id: this.context.id, rating: this.ratings[pid], site: this.props.state.site, stage: this.props.state.stage }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // triggers re-render so the paper is moved to RatedPapers
    this.setState({ expanded: expand })
    return false;
  }

  // called when the refresh button is pressed
  refreshModel(event: any) {
    fetch('/runModel', {
      method: 'POST',
      body: JSON.stringify({
        site: this.props.state.site,
        stage: this.props.state.stage
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  // called when a paper is un-starred
  favePaper(event: any) {
    const target = event.target
    const pid = target.id
    // send update to backend to update db
    fetch('/favePaper', {
      method: 'POST',
      body: JSON.stringify({
        paper_id: pid,
        site: this.props.state.site,
        stage: this.props.state.stage
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    // trigger re-render so paper is removed from section
    var faved = { ...this.state.fave };
    faved[pid] = !faved[pid];
    this.setState({ fave: faved })
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    if (prevProps.state.stage != this.props.state.stage || prevState.open != this.state.open || prevState.expanded != this.state.expanded || prevState.fave != this.state.fave) {
      // if there's a new state go back to showing nothing, reset the state variables
      if (prevProps.state.stage != this.props.state.stage) {
        this.rows = [];
        this.setState({ papers: "",
        open: false,
        expanded: {},
        fave: {} });
      }
      // otherwise get the recommendations
      else {
        fetch(`/newpapers/${this.props.state.site}/${this.props.state.stage}`)
          .then(res => res.json())
          .then(papers => {
            this.rows = [];
            this.ratings = {};
            let cards: any = [];
            papers.forEach((paper: any) => {
              this.ratings[paper.id] = 1;
              var card =
                <Card key={paper.id}>
                  <Card.Header style={{ cursor: 'pointer' }} onClick={() => {
                    var expand = { ...this.state.expanded };
                    expand[paper.id] = !expand[paper.id];
                    this.setState({ expanded: expand })
                  }}>
                    <b>{paper.title}</b>
                  </Card.Header>
                  <Collapse in={this.state.expanded[paper.id]}>
                    <div id={paper.id}>
                      <Card.Body>
                        <strong>Authors:</strong> <i className={this.state.fave[paper.id] ? "fas fa-star" : "far fa-star"} id={paper.id} onClick={this.favePaper} style={{ float: 'right', cursor: 'pointer' }} /><br />
                        {paper.authors}<br />
                        <strong>Abstract:</strong><br />
                        {paper.abstract}<br />
                        <strong>DOI:</strong><br />
                        {paper.doi}
                        <Form>
                          <Form.Select label='How relevant is this paper?' placeholder='Rating' options={ratingOptions} name={paper.id} onChange={this.updateRating} />
                          <Button primary href="#" name={paper.id} onClick={this.submitRating}>Submit</Button>
                        </Form>
                      </Card.Body>
                    </div>
                  </Collapse>
                </Card>
              cards.push(card);
            });
            // we also check if the model is currently running to disable the refresh button 
            fetch(`/queryRunning/${this.props.state.site}/${this.props.state.stage}`)
            .then(res => {
              var refresh: boolean
              if (res.status == 200) refresh = false;
              else refresh = true;
              this.rows.push(
                <h2 key="papers" style={{ display: 'inline-block' }}>New Recommendations</h2>,
                <Button key="rel-expand" onClick={() => { this.setState({ open: !this.state.open }) }} size='mini' compact style={{ marginLeft: '10px', marginTop: '-20px' }}>{this.state.open ? '-' : '+'}</Button>,
                <Collapse key="rel-lit-col" in={this.state.open}>
                  <div id="rel-lit-div">
                    {cards}
                    <hr />
                    <Alert key="refresh" variant="primary">
                      <p>
                        If there are no more papers in this section, or you've rated several papers and would like to refresh the recommendations, click the refresh button. This operation could take up to 15 minutes.
                      </p>
                      <hr />
                      <div className="d-flex justify-content-end">
                        {refresh && <Button onClick={this.refreshModel} variant="outline-primary">
                          Refresh
                        </Button>}
                        {!refresh && <div><i>Recommendations are being refreshed!</i><Button disabled variant="outline-primary">
                          Refresh
                        </Button></div>}
                      </div>
                    </Alert>
                  </div>
                </Collapse>,
              )
              // trigger re-render so papers are actually shown
              this.setState(this.state);
            })
          });
      }
    }
  }


  render() {
    return (
      <div id="papers" className="papers">
        {this.rows}
      </div>
    )
  }

}

/*
* AutoRadiOnc is the main component, every other component is a child of this
* Dynamically shows the Login page or main page if user is logged in
*/
class AutoRadiOnc extends Component<{}, any> {
  contextRef = React.createRef();

  constructor(props: any) {
    super(props);

    this.state = {
      site: "",
      stage: "",
      loggedIn: false,
      email: "",
      id: ""
    };

    this.updateAuth = this.updateAuth.bind(this);
    this.logout = this.logout.bind(this);
  }

  // catch any errors so user doesn't see them, then refresh page
  // this is a hack to reload the page if user is auto signed out
  componentDidCatch(error: any, info: any) {
    console.error(error, info);
    window.location.reload();
  }

  // first check if user is logged in
  componentDidMount() {
    document.body.style.backgroundColor = "#f7f7f7";
    fetch('/auth/getUser')
      .then(res => {
        if (res.status == 200) return res.json()
      })
      .then(user => {
        // user is logged in
        if (user != undefined) {
          this.updateAuth(true, user);
          this.setState(this.state);
        }
      })
  }

  // called when user is logged in to update state
  updateAuth(isLoggedIn: boolean, newUser: any) {
    this.setState({
      loggedIn: isLoggedIn,
      email: newUser.email,
      id: newUser.id
    })
  }

  // called when user clicks logout
  logout(event: any) {
    fetch('/auth/logout');
  }

  /*
  * this function is passed down to DiseaseSiteDropdown and StagingDropdown to update 
  * the global site/stage when selected
  */
  updateState(newSite: String, newStage: String) {
    this.setState({
      site: newSite,
      stage: newStage,
    })
  };

  render() {
    let content;

    // check if logged in
    if (this.state.loggedIn) {
      content = (
        <div>
          <Menu fixed='top' inverted borderless color='blue'>
            <Container>
              <Menu.Item as='a' header>
                Radiation Oncology Literature Review System
              </Menu.Item>
              <Menu.Menu position='right'>
                <Dropdown item text={this.state.email}>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={this.logout} href='/'>Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Menu.Menu>
            </Container>
          </Menu>
          <Grid columns={2}>
            <Grid.Column width={4}>
              <DiseaseSiteDropdown updateState={this.updateState.bind(this)} />
              <StagingDropdown state={this.state} updateState={this.updateState.bind(this)} />
            </Grid.Column>
            <Grid.Column width={12}>
              <userContext.Provider value={{ email: this.state.email, id: this.state.id }}>
                <div style={{ paddingTop: '10px' }}>
                  {(this.state.site == "" || this.state.stage == "") ? 
                  <div>
                    <h2>
                      Welcome to the Radiation Oncology Literature Review System
                    </h2>
                    This system uses machine learning models to recommend new literature based on ratings of previously seen literature.
                    <br />
                    <br />
                    <h4>
                      Treatment Recommendations
                    </h4>
                    <p>
                      The treatment recommendations are from the Handbook of Evidence Based Radiation Oncology.
                    </p>
                    <h4>
                      Saved Papers
                    </h4>
                    <p>
                      This section lists papers you have saved for future reference. To add a paper to this section,
                    click the <i className="far fa-star" /> icon in the top right of each paper description in the New Recommendations and Rated Paper sections.
                    </p>
                    <h4>
                      New Recommendations
                    </h4>
                    <p>
                      This section shows the top 10 recommended papers by the machine learning model. To view a paper's abstract,
                      click on the title of the paper. The paper's information will expand out and a rating dropdown will appear.
                      Rating papers helps train the model to produce better recommendations, so new recommendations are shown as you add ratings.
                    <br /><br />
                      Sometimes for a site/stage combination there will be no more recommended papers or after many papers have been rated the recommendations will be stale.
                      When this happens, click on the "Refresh" button at the bottom of the section to refresh the recommendations. This
                      operation could take up to 15 minutes to complete. If the recommendations are already being refreshed for the current site/stage, the "Refresh"
                      button will be disabled.
                    </p>
                    <h4>
                      Rated Papers
                    </h4>
                    <p>
                      In this section you will find papers that you have already rated. You can click the paper titles to see the paper's information
                      and update your rating if necessary.
                    </p>
                    <h4>
                      Add A Paper
                    </h4>
                    <p>
                      If there is a paper that you would like to add to the system, you can do so here. Enter the Pubmed ID of the paper and your rating
                      and click "Submit". A message will be displayed showing whether it succeeded or failed.
                    </p>
                    <br />
                    <h3>
                      To get started, select a disease site and a stage on the left
                    </h3>
                    <br />
                  </div> : <></>}

                  <TreatmentRec state={this.state} />
                  <br />
                  <FavoritePapers state={this.state} />
                  <br />
                  <NewPapers state={this.state} />
                  <br />
                  <RatedPapers state={this.state} />
                  <br />
                  <SuggestPaper state={this.state} />
                </div>
              </userContext.Provider>
            </Grid.Column>
          </Grid>
        </div>
      )
    }
    // if not show login page
    else {
      content = <Login />
    }

    return (
      <div className="AutoRadiOnc">
        <Helmet>
          <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/all.css" integrity="sha384-oS3vJWv+0UjzBfQzYUhtDYW+Pj2yciDJxpsK1OYPAYjqT085Qq/1cq5FLXAZQ7Ay" crossOrigin="anonymous" />
        </Helmet>
        <Container>
          {content}
        </Container>
      </div>
    );
  }
}

/*
* Login displays the login page
* Very similar to Signup
*/
class Login extends Component<{}, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      email: "",
      password: "",
      valid: false,
      failed: false
    };

    this.updateState = this.updateState.bind(this);
    this.submit = this.submit.bind(this);
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    if (prevState.email != this.state.email || prevState.password != this.state.password) {
      // check if the email is valid email format and password exists
      // if so, enable submit button
      if (this.state.password != "" && this.state.email != "" && this.state.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
        this.setState({
          valid: true
        })
      }
      else this.setState({
        valid: false
      })
    }
  }

  // update email/password state variable every time letter is pressed
  updateState(event: any) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value,
    });
  }

  // called when user clicks submit
  submit() {
    if (this.state.email != "") {
      // try to login
      fetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(this.state),
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => {
        // if invalid login, show the failure banner
        if (res.status == 401) this.setState({ failed: true })
        // otherwise, refresh to show main page
        else {
          this.setState({ failed: false })
          window.location.reload()
        }
      });
    }
  }

  render() {
    return (
      <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as='h2' color='blue' textAlign='center'>
            Login to your account
          </Header>
          <Form size='large'>
            <Segment stacked>
              <Form.Input fluid icon='user' iconPosition='left' placeholder='E-mail address' type='email' name='email' required onChange={this.updateState} />
              <Form.Input
                fluid
                icon='lock'
                iconPosition='left'
                placeholder='Password'
                type='password'
                name='password'
                required onChange={this.updateState}
              />

              <Button
                color='blue'
                fluid size='large'
                onClick={this.submit}
                disabled={!this.state.valid}
                href='#'
              >
                Login
          </Button>
            </Segment>
          </Form>
          <Message negative hidden={!this.state.failed}>
            Incorrect credentials!
          </Message>
          <Message>
            Forgot your password? <a href='/reset'>Reset Password</a>
            <br />
            New to us? <a href='/signup'>Sign Up</a>
          </Message>
        </Grid.Column>
      </Grid>
    )
  }
}

/*
* PasswordReset shows the page to enter a new password when resetting
* Very similar to Login and GenerateReset
*/
class PasswordReset extends Component<{ match: any }, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      password: "",
      tokenValid: false,
      fieldValid: false
    }
    this.updateState = this.updateState.bind(this);
    this.submit = this.submit.bind(this);
  }

  // catch any errors so user doesn't see them, then refresh page
  componentDidCatch(error: any, info: any) {
    console.error(error, info);
    window.location.reload();
  }

  // first check if the token is valid then display appropriate messages
  componentDidMount() {
    document.body.style.backgroundColor = "#f7f7f7";
    fetch(`/validateReset/${this.props.match.params.token}`)
      .then(res => {
        if (res.status == 200) this.setState({ tokenValid: true })
        else if (res.status == 404) this.setState({ tokenValid: false })
      })
  }


  // enable submit button if password is entered, keep disabled if password field blank
  componentDidUpdate(prevProps: any, prevState: any) {
    if (prevState.password != this.state.password) {
      if (this.state.password != "") {
        this.setState({
          fieldValid: true
        })
      }
      else this.setState({
        fieldValid: false
      })
    }
  }

  // update password state variable every time letter is pressed
  updateState(event: any) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    console.log(value);

    this.setState({
      [name]: value,
    });
  }

  // called when user clicks submit
  submit() {
    // update password
    fetch('/submitReset', {
      method: 'POST',
      body: JSON.stringify({
        token: this.props.match.params.token,
        password: this.state.password
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    // redirect to home page
    .then(res => window.location.assign('/'))
  }

  render() {
    return (
      <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as='h2' color='blue' textAlign='center'>
            Reset your password
          </Header>
          {this.state.tokenValid && <div><Form size='large'>
            <Segment stacked>
              <Form.Input fluid icon='lock' iconPosition='left' placeholder='Password' type='password' name='password' required onChange={this.updateState} />
              <Button
                color='blue'
                fluid size='large'
                onClick={this.submit}
                disabled={!this.state.fieldValid}
                href='#'
              >
                Submit
          </Button>
            </Segment>
          </Form>
            <Message>
              Enter a new password.
        </Message></div>}
          {!this.state.tokenValid && <Message negative>
            Invalid Reset Link <br /><a href='/'>Return Home</a>
          </Message>}
        </Grid.Column>
      </Grid>
    )
  }
}

/*
* GenerateReset shows the page to enter email when user is resetting password
* Very similar to Login and PasswordReset
*/
class GenerateReset extends Component<{}, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      email: "",
      valid: false,
    }

    this.updateState = this.updateState.bind(this);
    this.submit = this.submit.bind(this);
  }

  // catch any errors so user doesn't see them, then refresh page
  componentDidCatch(error: any, info: any) {
    console.error(error, info);
    window.location.reload();
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    if (prevState.email != this.state.email) {
      // check if the email is valid email format
      // if so, enable submit button
      if (this.state.email != "" && this.state.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
        this.setState({
          valid: true
        })
      }
      else this.setState({
        valid: false
      })
    }
  }

  // update email state variable every time letter is pressed
  updateState(event: any) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value,
    });
  }
  // called when user clicks submit
  submit() {
    fetch('/generateReset', {
      method: 'POST',
      body: JSON.stringify(this.state),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    // redirect to home page after generated
    .then(res => window.location.assign('/'))
  }

  render() {
    document.body.style.backgroundColor = "#f7f7f7";
    return (
      <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as='h2' color='blue' textAlign='center'>
            Reset your password
          </Header>
          <Form size='large'>
            <Segment stacked>
              <Form.Input fluid icon='user' iconPosition='left' placeholder='E-mail address' type='email' name='email' required onChange={this.updateState} />
              <Button
                color='blue'
                fluid size='large'
                onClick={this.submit}
                disabled={!this.state.valid}
                href='#'
              >
                Submit
          </Button>
            </Segment>
          </Form>
          <Message>
            Enter your email to reset your password.
          <br /><br />
            An email will be sent to you with instructions to reset your password if your account exists. If the email doesn't show up, make sure to check your Spam inbox.
          </Message>
        </Grid.Column>
      </Grid>
    )
  }
}

/*
* Signup displays the signup page
* Very similar to Login
*/
class Signup extends Component<{}, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      email: "",
      password: "",
      valid: false,
      failed: false,
      success: false
    };

    this.updateState = this.updateState.bind(this);
    this.submit = this.submit.bind(this);
  }

  // catch any errors so user doesn't see them, then refresh page
  componentDidCatch(error: any, info: any) {
    console.error(error, info);
    window.location.reload();
  }

  // first check if the user is already logged in
  componentDidMount() {
    document.body.style.backgroundColor = "#f7f7f7";
    fetch('/auth/getUser')
      .then(res => {
        if (res.status == 200) return res.json()
      })
      .then(user => {
        // if so, redirect to main page
        if (user != undefined) {
          window.location.replace("/")
        }
      })
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    if (prevState.email != this.state.email || prevState.password != this.state.password) {
      // check if the email is valid email format and password exists
      // if so, enable submit button
      if (this.state.password != "" && this.state.email != "" && this.state.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
        this.setState({
          valid: true
        })
      }
      else this.setState({
        valid: false
      })
    }
  }

  // update email/password state variable every time letter is pressed
  updateState(event: any) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value,
      failed: false,
      success: false
    });
  }

  // called when user clicks submit
  submit() {
    if (this.state.email != "") {
      // try to signup
      fetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(this.state),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(res => {
        // if email already exists
        if (res.status == 403) this.setState({ failed: true })
        else {
          // if created, redirect to main page
          this.setState({ success: true })
          window.location.assign('/');
        }
      });
    }
  }

  render() {
    return (
      <div className="signup">
        <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
          <Grid.Column style={{ maxWidth: 450 }}>
            <Header as='h2' color='blue' textAlign='center'>
              Create an account
          </Header>
            <Form size='large'>
              <Segment stacked>
                <Form.Input fluid icon='user' iconPosition='left' placeholder='E-mail address' name='email' required onChange={this.updateState} />
                <Form.Input
                  fluid
                  icon='lock'
                  iconPosition='left'
                  placeholder='Password'
                  name='password'
                  type='password'
                  required onChange={this.updateState}
                />

                <Button color='blue' fluid size='large' disabled={!this.state.valid} onClick={this.submit}>
                  Signup
                </Button>
              </Segment>
            </Form>
            <Message positive hidden={!this.state.success}>
              Success! Redirecting to login...
            </Message>
            <Message negative hidden={!this.state.failed}>
              That email is already associated with an account!
            </Message>
            <Message>
              Already have an account? <a href='/'>Login</a>
            </Message>
          </Grid.Column>
        </Grid>
      </div>
    )
  }
}

// the main export
function App() {
  return (
    <Switch>
      <Route exact path='/' component={AutoRadiOnc} />
      <Route path='/signup' component={Signup} />
      <Route path='/reset' component={GenerateReset} />
      <Route path='/password-reset/:token' component={PasswordReset} />
    </Switch>
  )
}

export default App;
