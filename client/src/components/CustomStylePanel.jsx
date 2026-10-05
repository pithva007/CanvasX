import React from 'react'
import {
  DefaultStylePanel,
  DefaultColorStyle,
  DefaultFillStyle,
  DefaultDashStyle,
  DefaultSizeStyle,
  DefaultFontStyle,
  GeoShapeGeoStyle,
  ArrowShapeArrowheadEndStyle,
  ArrowShapeArrowheadStartStyle,
  LineShapeSplineStyle,
  getDefaultColorTheme,
  useEditor,
  useRelevantStyles,
  useTranslation,
  useUiEvents,
  TldrawUiButtonPicker,
  OpacitySlider,
  TextStylePickerSet,
  GeoStylePickerSet,
  ArrowheadStylePickerSet,
  SplineStylePickerSet,
} from 'tldraw'
import { COLOR_SWATCH_ITEMS } from '@/utils/customTheme'

const FILL_ITEMS = [
  { value: 'none', icon: 'fill-none' },
  { value: 'semi', icon: 'fill-semi' },
  { value: 'solid', icon: 'fill-solid' },
  { value: 'pattern', icon: 'fill-pattern' },
]

const DASH_ITEMS = [
  { value: 'draw', icon: 'dash-draw' },
  { value: 'dashed', icon: 'dash-dashed' },
  { value: 'dotted', icon: 'dash-dotted' },
  { value: 'solid', icon: 'dash-solid' },
]

const SIZE_ITEMS = [
  { value: 's', icon: 'size-small' },
  { value: 'm', icon: 'size-medium' },
  { value: 'l', icon: 'size-large' },
  { value: 'xl', icon: 'size-extra-large' },
]

function useStyleChangeCallback() {
  const editor = useEditor()
  const trackEvent = useUiEvents?.() || (() => {})

  return React.useMemo(
    () =>
      function handleStyleChange(style, value) {
        editor.run(() => {
          if (editor.isIn('select')) {
            editor.setStyleForSelectedShapes(style, value)
          }
          editor.setStyleForNextShapes(style, value)
          editor.updateInstanceState({ isChangingStyle: true })
        })

        try {
          trackEvent('set-style', {
            source: 'style-panel',
            id: style.id,
            value: String(value),
          })
        } catch (_) {}
      },
    [editor, trackEvent]
  )
}

export function CustomCommonStylePickerSet({ styles, theme }) {
  const msg = useTranslation()
  const handleValueChange = useStyleChangeCallback()

  const color = styles.get(DefaultColorStyle)
  const fill = styles.get(DefaultFillStyle)
  const dash = styles.get(DefaultDashStyle)
  const size = styles.get(DefaultSizeStyle)

  const showPickers = fill !== undefined || dash !== undefined || size !== undefined

  return (
    <>
      <div
        tabIndex={-1}
        className="tlui-style-panel__section__common"
        aria-label="style panel styles"
        data-testid="style.panel"
      >
        {color !== undefined && (
          <TldrawUiButtonPicker
            title={msg('style-panel.color')}
            uiType="color"
            style={DefaultColorStyle}
            items={COLOR_SWATCH_ITEMS}
            value={color}
            onValueChange={handleValueChange}
            theme={theme}
          />
        )}
        <OpacitySlider />
      </div>

      {showPickers && (
        <div className="tlui-style-panel__section" aria-label="style panel styles">
          {fill !== undefined && (
            <TldrawUiButtonPicker
              title={msg('style-panel.fill')}
              uiType="fill"
              style={DefaultFillStyle}
              items={FILL_ITEMS}
              value={fill}
              onValueChange={handleValueChange}
              theme={theme}
            />
          )}
          {dash !== undefined && (
            <TldrawUiButtonPicker
              title={msg('style-panel.dash')}
              uiType="dash"
              style={DefaultDashStyle}
              items={DASH_ITEMS}
              value={dash}
              onValueChange={handleValueChange}
              theme={theme}
            />
          )}
          {size !== undefined && (
            <TldrawUiButtonPicker
              title={msg('style-panel.size')}
              uiType="size"
              style={DefaultSizeStyle}
              items={SIZE_ITEMS}
              value={size}
              onValueChange={handleValueChange}
              theme={theme}
            />
          )}
        </div>
      )}
    </>
  )
}

export function CustomStylePanelContent({ styles }) {
  const editor = useEditor()
  const isDarkMode = editor.user.getIsDarkMode()

  const geo = styles.get(GeoShapeGeoStyle)
  const arrowheadEnd = styles.get(ArrowShapeArrowheadEndStyle)
  const arrowheadStart = styles.get(ArrowShapeArrowheadStartStyle)
  const spline = styles.get(LineShapeSplineStyle)
  const font = styles.get(DefaultFontStyle)

  const hideGeo = geo === undefined
  const hideArrowHeads = arrowheadEnd === undefined && arrowheadStart === undefined
  const hideSpline = spline === undefined
  const hideText = font === undefined

  const theme = getDefaultColorTheme({ isDarkMode })

  return (
    <>
      <CustomCommonStylePickerSet theme={theme} styles={styles} />
      {!hideText && <TextStylePickerSet theme={theme} styles={styles} />}
      {!(hideGeo && hideArrowHeads && hideSpline) && (
        <div className="tlui-style-panel__section" aria-label="style panel styles">
          <GeoStylePickerSet styles={styles} />
          <ArrowheadStylePickerSet styles={styles} />
          <SplineStylePickerSet styles={styles} />
        </div>
      )}
    </>
  )
}

export function CustomStylePanel(props) {
  const styles = useRelevantStyles()
  return (
    <DefaultStylePanel {...props}>
      <CustomStylePanelContent styles={styles} />
    </DefaultStylePanel>
  )
}
