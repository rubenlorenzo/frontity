import React from "react";
import { Head, connect } from "frontity";
import { Connect } from "frontity/types";
import ComscoreAnalytics from "../../types";

const ComscoreHead: React.FC<{ id?: string }> = ({ id }) => (
  <Head>
    <noscript>
      {`<img alt="comScore" src="https://sb.scorecardresearch.com/p?c1=2&c2=${id}&cv=2.0&cj=1" />`}
    </noscript>
    <script async src="https://sb.scorecardresearch.com/beacon.js" />
  </Head>
);

export const Root: React.FC<Connect<ComscoreAnalytics>> = ({ state }) => {
  const { trackingIds } = state.comscoreAnalytics;
  const hasTrackingId = trackingIds && trackingIds.length > 1;

  return (
    <>
      {hasTrackingId &&
        trackingIds.map((id) => <ComscoreHead id={id} key={id} />)}
    </>
  );
};

export default connect(Root);
