/** @jsx jsx */
import { jsx } from "theme-ui"
import React, { Component } from "react"
import MdArrowDownward from "react-icons/lib/md/arrow-downward"
import Fuse from "fuse.js"

import { loadMoreButton } from "../shared/styles"
import ShowcaseList from "./showcase-list"
import Filters from "./filters"
import SearchIcon from "../../components/search-icon"
import Button from "../../components/button"
import FooterLinks from "../../components/shared/footer-links"
import {
  ContentHeader,
  ContentTitle,
  ContentContainer,
} from "../shared/sidebar"
import { themedInput } from "../../utils/styles"

const OPEN_SOURCE_CATEGORY = `Open Source`

const filterByCategories = (list, categories) => {
  const items = list.reduce((aggregated, edge) => {
    if (edge.node.categories) {
      const filteredCategories = edge.node.categories.filter(c =>
        categories.includes(c)
      )
      if (
        categories.length === 0 ||
        filteredCategories.length === categories.length
      ) {
        aggregated.push(edge)
      }

      return aggregated
    }

    return aggregated
  }, [])

  return items
}

class FilteredShowcase extends Component {
  state = {
    search: ``,
    sitesToShow: 12,
  }

  constructor(props) {
    super(props)

    const options = {
      shouldSort: true,
      threshold: 0.6,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [
        `node.title`,
        `node.categories`,
        `node.built_by`,
        `node.description`,
      ],
    }

    this.fuse = new Fuse(props.data.allSitesYaml.edges, options)
  }

  render() {
    const { data, filters, setFilters } = this.props

    let items = data.allSitesYaml.edges

    if (this.state.search.length > 0) {
      items = this.fuse.search(this.state.search)
    }

    if (filters && filters.length > 0) {
      items = filterByCategories(items, filters)
    }

    // create map of categories with totals
    const aggregatedCategories = items.reduce((categories, edge) => {
      if (!edge.node.categories) {
        edge.node.categories = []
      }
      const idx = edge.node.categories.indexOf(OPEN_SOURCE_CATEGORY)
      if (idx !== -1) {
        edge.node.categories.splice(idx, 1)
      }
      if (edge.node.source_url) {
        edge.node.categories.push(OPEN_SOURCE_CATEGORY)
      }
      edge.node.categories.forEach(category => {
        // if we already have the category recorded, increase count
        if (categories[category]) {
          categories[category] = categories[category] + 1
        } else {
          // record first encounter of category
          categories[category] = 1
        }
      })
      edge.node.categories.sort((str1, str2) =>
        str1.toLowerCase().localeCompare(str2.toLowerCase())
      )

      return { ...categories }
    }, {})

    // get sorted set of categories to generate list with
    const categoryKeys = Object.keys(aggregatedCategories).sort((str1, str2) =>
      str1.toLowerCase().localeCompare(str2.toLowerCase())
    )

    return (
      <section className="showcase" css={{ display: `flex` }}>
        <Filters
          setFilters={setFilters}
          filters={filters}
          categoryKeys={categoryKeys}
          aggregatedCategories={aggregatedCategories}
        />
        <ContentContainer>
          <ContentHeader>
            <ContentTitle
              search={this.state.search}
              filters={filters}
              label="Site"
              items={items}
              edges={data.allSitesYaml.edges}
            />
            <div sx={{ ml: `auto` }}>
              <label css={{ position: `relative` }}>
                <input
                  sx={themedInput}
                  type="search"
                  value={this.state.search}
                  onChange={e => this.setState({ search: e.target.value })}
                  placeholder="Search sites"
                  aria-label="Search sites"
                />
                <SearchIcon />
              </label>
            </div>
          </ContentHeader>

          <ShowcaseList
            items={items}
            count={this.state.sitesToShow}
            filters={filters}
            onCategoryClick={c => setFilters(c)}
          />

          {this.state.sitesToShow < items.length && (
            <Button
              large
              tag="button"
              overrideCSS={loadMoreButton}
              onClick={() => {
                this.setState({
                  sitesToShow: this.state.sitesToShow + 15,
                })
              }}
              icon={<MdArrowDownward />}
            >
              Load More
            </Button>
          )}
          <FooterLinks />
        </ContentContainer>
      </section>
    )
  }
}

export default FilteredShowcase
