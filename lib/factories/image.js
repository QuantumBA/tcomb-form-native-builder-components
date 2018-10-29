import React                    from 'react'

import { View }                 from 'react-native'
import t                        from 'tcomb-form-native/lib'
import FitImage                 from 'react-native-fit-image'
import { undefinedTransformer } from '../transformers'

const { Component } = t.form


class Image extends Component {

  getTemplate() {
    const { options: { style, uri } } = this.props

    return ({ label, stylesheet: { image } }) => (
      <View style={[style, { alignSelf: 'center' }]}>
        <FitImage
          accessibilityLabel={label}
          source={{ uri }}
          style={image}
        />
      </View>
    )

  }

}
Image.transformer = undefinedTransformer

export default Image
