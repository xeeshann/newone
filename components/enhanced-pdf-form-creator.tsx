"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, Trash2, Copy, Download, Plus, Layout, Settings, Image } from 'lucide-react'
import { Progress } from "@/components/ui/progress"
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

type FormElementType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'textarea' | 'freetext'

interface FormElement {
  id: string
  type: FormElementType
  label: string
  options?: string[]
  required: boolean
  fontSize: number
  content?: string
}

const CANVAS_WIDTH = 595 // A4 width in points
const CANVAS_HEIGHT = 842 // A4 height in points
const MARGIN = 50
const FIELD_HEIGHT = 25
const LABEL_OFFSET = 5
const LOGO_SIZE = 50
const LOGO_MARGIN = 20

const themes = {
  light: { bg: 'bg-white', text: 'text-gray-900', field: 'bg-white', border: 'border-gray-300', pdfBg: [1, 1, 1] as [number, number, number], pdfText: [0, 0, 0] as [number, number, number], pdfField: [0.98, 0.98, 0.98] as [number, number, number] },
  dark: { bg: 'bg-gray-900', text: 'text-white', field: 'bg-gray-800', border: 'border-gray-700', pdfBg: [0.1, 0.1, 0.1] as [number, number, number], pdfText: [1, 1, 1] as [number, number, number], pdfField: [0.2, 0.2, 0.2] as [number, number, number] },
  blue: { bg: 'bg-blue-100', text: 'text-blue-900', field: 'bg-blue-50', border: 'border-blue-300', pdfBg: [0.9, 0.95, 1] as [number, number, number], pdfText: [0, 0, 0.6] as [number, number, number], pdfField: [0.95, 0.97, 1] as [number, number, number] },
  green: { bg: 'bg-green-100', text: 'text-green-900', field: 'bg-green-50', border: 'border-green-300', pdfBg: [0.9, 1, 0.9] as [number, number, number], pdfText: [0, 0.5, 0] as [number, number, number], pdfField: [0.95, 1, 0.95] as [number, number, number] },
  purple: { bg: 'bg-purple-100', text: 'text-purple-900', field: 'bg-purple-50', border: 'border-purple-300', pdfBg: [0.98, 0.9, 1] as [number, number, number], pdfText: [0.5, 0, 0.5] as [number, number, number], pdfField: [0.99, 0.95, 1] as [number, number, number] },
  'blue-gradient': { bg: 'bg-gradient-to-r from-blue-400 to-blue-600', text: 'text-white', field: 'bg-blue-100', border: 'border-blue-300', pdfBg: [0.6, 0.8, 1] as [number, number, number], pdfText: [1, 1, 1] as [number, number, number], pdfField: [0.8, 0.9, 1] as [number, number, number] },
  'green-gradient': { bg: 'bg-gradient-to-r from-green-400 to-green-600', text: 'text-white', field: 'bg-green-100', border: 'border-green-300', pdfBg: [0.6, 1, 0.6] as [number, number, number], pdfText: [1, 1, 1] as [number, number, number], pdfField: [0.8, 1, 0.8] as [number, number, number] },
  'purple-gradient': { bg: 'bg-gradient-to-r from-purple-400 to-purple-600', text: 'text-white', field: 'bg-purple-100', border: 'border-purple-300', pdfBg: [0.8, 0.6, 1] as [number, number, number], pdfText: [1, 1, 1] as [number, number, number], pdfField: [0.9, 0.8, 1] as [number, number, number] },
}

const fontStyles = {
  'helvetica': StandardFonts.Helvetica,
  'helvetica-bold': StandardFonts.HelveticaBold,
  'times-roman': StandardFonts.TimesRoman,
  'times-bold': StandardFonts.TimesRomanBold,
  'courier': StandardFonts.Courier,
  'courier-bold': StandardFonts.CourierBold,
}

const FormElementComponent: React.FC<{
  element: FormElement
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onUpdateProperties: (id: string, updates: Partial<FormElement>) => void
  theme: keyof typeof themes
  fontStyle: string
}> = ({ element, onDelete, onDuplicate, onUpdateProperties, theme, fontStyle }) => {
  const renderElement = () => {
    const fieldClasses = `w-full ${themes[theme].field} ${themes[theme].border} border rounded-md`
    switch (element.type) {
      case 'text':
        return <Input id={element.id} placeholder="Enter text" className={fieldClasses} />
      case 'checkbox':
        return (
          <div className="space-y-2">
            {element.options?.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2">
                <Checkbox id={`${element.id}-${optionIndex}`} className={themes[theme].border} />
                <Label htmlFor={`${element.id}-${optionIndex}`}>{option}</Label>
              </div>
            ))}
          </div>
        )
      case 'radio':
        return (
          <RadioGroup>
            {element.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${element.id}-${index}`} className={themes[theme].border} />
                <Label htmlFor={`${element.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )
      case 'dropdown':
        return (
          <Select>
            <SelectTrigger className={fieldClasses}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {element.options?.map((option, index) => (
                <SelectItem key={index} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'textarea':
        return <Textarea id={element.id} placeholder="Enter text" className={fieldClasses} />
      case 'freetext':
        return <div className={`${fieldClasses} p-2`}>{element.content}</div>
      default:
        return null
    }
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <Label htmlFor={element.id} className={`font-semibold font-${fontStyle}`}>{element.label}</Label>
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon"><ChevronDown className="h-4 w-4" /></Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${element.id}-label`}>Label</Label>
                    <Input
                      id={`${element.id}-label`}
                      value={element.label}
                      onChange={(e) => onUpdateProperties(element.id, { label: e.target.value })}
                    />
                  </div>
                  {element.type !== 'freetext' && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${element.id}-required`}
                        checked={element.required}
                        onCheckedChange={(checked) => onUpdateProperties(element.id, { required: checked })}
                      />
                      <Label htmlFor={`${element.id}-required`}>Required</Label>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor={`${element.id}-font-size`}>Font Size: {element.fontSize}px</Label>
                    <Slider
                      id={`${element.id}-font-size`}
                      min={8}
                      max={24}
                      step={1}
                      value={[element.fontSize]}
                      onValueChange={([value]) => onUpdateProperties(element.id, { fontSize: value })}
                    />
                  </div>
                  {(element.type === 'radio' || element.type === 'dropdown' || element.type === 'checkbox') && (
                    <div className="space-y-2">
                      <Label htmlFor={`${element.id}-options`}>Options (comma-separated)</Label>
                      <Input
                        id={`${element.id}-options`}
                        value={element.options?.join(', ')}
                        onChange={(e) => onUpdateProperties(element.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                      />
                    </div>
                  )}
                  {element.type === 'freetext' && (
                    <div className="space-y-2">
                      <Label htmlFor={`${element.id}-content`}>Content</Label>
                      <Textarea
                        id={`${element.id}-content`}
                        value={element.content}
                        onChange={(e) => onUpdateProperties(element.id, { content: e.target.value })}
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={() => onDuplicate(element.id)}><Copy className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => onDelete(element.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        {renderElement()}
      </CardContent>
    </Card>
  )
}

export function EnhancedPdfFormCreator() {
  const [elements, setElements] = useState<FormElement[]>([])
  const [nextId, setNextId] = useState(1)
  const [formTitle, setFormTitle] = useState("My Form")
  const [formDescription, setFormDescription] = useState("This is a sample form description.")
  const [activeTab, setActiveTab] = useState('design')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formTheme, setFormTheme] = useState<keyof typeof themes>('light')
  const [fontStyle, setFontStyle] = useState('helvetica')
  const [logo, setLogo] = useState<File | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addElement = useCallback((type: FormElementType) => {
    const newElement: FormElement = {
      id: `element-${nextId}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nextId}`,
      required: false,
      fontSize: 12,
      options: type === 'radio' || type === 'dropdown' || type === 'checkbox' ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
      content: type === 'freetext' ? 'Enter your text here' : undefined,
    }

    setElements(prevElements => [...prevElements, newElement])
    setNextId(prevId => prevId + 1)
  }, [nextId])

  const handleDelete = useCallback((id: string) => {
    setElements(prevElements => prevElements.filter(el => el.id !== id))
  }, [])

  const handleDuplicate = useCallback((id: string) => {
    setElements(prevElements => {
      const elementToDuplicate = prevElements.find(el => el.id === id)
      if (elementToDuplicate) {
        const newElement = {
          ...elementToDuplicate,
          id: `element-${nextId}`,
        }
        setNextId(prevId => prevId + 1)
        return [...prevElements, newElement]
      }
      return prevElements
    })
  }, [nextId])

  const handleUpdateProperties = useCallback((id: string, updates: Partial<FormElement>) => {
    setElements(prevElements => prevElements.map(el => el.id === id ? { ...el, ...updates } : el))
  }, [])

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogo(file)
    }
  }

  const generatePDF = useCallback(async () => {
    setIsDownloading(true)
    setDownloadProgress(0)
    setError(null)

    try {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([CANVAS_WIDTH, CANVAS_HEIGHT])
      const form = pdfDoc.getForm()

      const fontName = fontStyles[fontStyle as keyof typeof fontStyles] || StandardFonts.Helvetica
      const font = await pdfDoc.embedFont(fontName)

      const { pdfBg, pdfText, pdfField } = themes[formTheme]
      page.drawRectangle({
        x: 0,
        y: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        color: rgb(...pdfBg as [number, number, number]),
      })

      // Add logo if available
      if (logo) {
        const logoImage = await pdfDoc.embedPng(await logo.arrayBuffer())
        const logoDims = logoImage.scale(LOGO_SIZE / logoImage.width)
        page.drawImage(logoImage, {
          x: LOGO_MARGIN,
          y: CANVAS_HEIGHT - LOGO_MARGIN - logoDims.height,
          width: logoDims.width,
          height: logoDims.height,
        })
      }

      const titleWidth = font.widthOfTextAtSize(formTitle, 18)
      page.drawText(formTitle, {
        x: (CANVAS_WIDTH - titleWidth) / 2,
        y: CANVAS_HEIGHT - MARGIN,
        size: 18,
        font: font,
        color: rgb(...pdfText),
      })

      const descriptionLines = formDescription.split('\n')
      descriptionLines.forEach((line, index) => {
        const lineWidth = font.widthOfTextAtSize(line, 12)
        page.drawText(line, {
          x: (CANVAS_WIDTH - lineWidth) / 2,
          y: CANVAS_HEIGHT - MARGIN - 30 - (index * 15),
          size: 12,
          font: font,
          color: rgb(...pdfText),
        })
      })

      let yOffset = CANVAS_HEIGHT - MARGIN - 60 - (descriptionLines.length - 1) * 15

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i]
        const fieldWidth = CANVAS_WIDTH - 2 * MARGIN

        page.drawText(element.label, {
          x: MARGIN,
          y: yOffset,
          size: element.fontSize,
          font: font,
          color: rgb(...pdfText),
        })

        yOffset -= LABEL_OFFSET + FIELD_HEIGHT

        switch (element.type) {
          case 'text':
            const textField = form.createTextField(`field-${element.id}`)
            textField.setText('')
            textField.addToPage(page, {
              x: MARGIN,
              y: yOffset,
              width: fieldWidth,
              height: FIELD_HEIGHT,
              borderWidth: 1,
              borderColor: rgb(...pdfText),
              backgroundColor: rgb(...pdfField),
            })
            yOffset -= FIELD_HEIGHT + 10
            break
          case 'checkbox':
            element.options?.forEach((option, optionIndex) => {
              const checkBox = form.createCheckBox(`field-${element.id}-${optionIndex}`)
              checkBox.addToPage(page, {
                x: MARGIN,
                y: yOffset - (optionIndex * (FIELD_HEIGHT + 5)),
                width: FIELD_HEIGHT,
                height: FIELD_HEIGHT,
                borderWidth: 1,
                borderColor: rgb(...pdfText),
                backgroundColor: rgb(...pdfField),
              })
              page.drawText(option, {
                x: MARGIN + FIELD_HEIGHT + 5,
                y: yOffset - (optionIndex * (FIELD_HEIGHT + 5)) + 5,
                size: element.fontSize,
                font: font,
                color: rgb(...pdfText),
              })
            })
            yOffset -= (element.options?.length || 0) * (FIELD_HEIGHT + 5) + 10
            break
          case 'radio':
            const radioGroup = form.createRadioGroup(`field-${element.id}`)
            element.options?.forEach((option, optionIndex) => {
              radioGroup.addOptionToPage(option, page, {
                x: MARGIN,
                y: yOffset - (optionIndex * (FIELD_HEIGHT + 5)),
                width: FIELD_HEIGHT,
                height: FIELD_HEIGHT,
                borderWidth: 1,
                borderColor: rgb(...pdfText),
                backgroundColor: rgb(...pdfField),
              })
              page.drawText(option, {
                x: MARGIN + FIELD_HEIGHT + 5,
                y: yOffset - (optionIndex * (FIELD_HEIGHT + 5)) + 5,
                size: element.fontSize,
                font: font,
                color: rgb(...pdfText),
              })
            })
            yOffset -= (element.options?.length || 0) * (FIELD_HEIGHT + 5) + 10
            break
          case 'dropdown':
            const dropdown = form.createDropdown(`field-${element.id}`)
            dropdown.addOptions(element.options || [])
            dropdown.addToPage(page, {
              x: MARGIN,
              y: yOffset,
              width: fieldWidth,
              height: FIELD_HEIGHT,
              borderWidth: 1,
              borderColor: rgb(...pdfText),
              backgroundColor: rgb(...pdfField),
            })
            yOffset -= FIELD_HEIGHT + 10
            break
          case 'textarea':
            const textArea = form.createTextField(`field-${element.id}`)
            textArea.setText('')
            textArea.addToPage(page, {
              x: MARGIN,
              y: yOffset - FIELD_HEIGHT * 2,
              width: fieldWidth,
              height: FIELD_HEIGHT * 3,
              borderWidth: 1,
              borderColor: rgb(...pdfText),
              backgroundColor: rgb(...pdfField),
            })
            textArea.setFontSize(10)
            textArea.enableMultiline()
            yOffset -= FIELD_HEIGHT * 3 + 10
            break
          case 'freetext':
            page.drawText(element.content || '', {
              x: MARGIN,
              y: yOffset,
              size: element.fontSize,
              font: font,
              color: rgb(...pdfText),
            })
            yOffset -= FIELD_HEIGHT + 10
            break
        }

        setDownloadProgress(((i + 1) / elements.length) * 100)
      }

      const pdfBytes = await pdfDoc.save()
      return new Blob([pdfBytes], { type: 'application/pdf' })
    } catch (error) {
      console.error('Error generating PDF:', error)
      if (error instanceof Error) {
        setError(`An error occurred while generating the PDF: ${error.message}`)
      } else {
        setError('An unknown error occurred while generating the PDF.')
      }
      throw error
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }, [elements, formTitle, formDescription, formTheme, fontStyle, logo])

  const downloadPDF = useCallback(async () => {
    try {
      const pdfBlob = await generatePDF()
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'fillable_form.pdf'
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error in downloadPDF:', error)
      if (error instanceof Error) {
        setError(`An error occurred while downloading the PDF: ${error.message}. Please try again.`)
      } else {
        setError('An unknown error occurred while downloading the PDF. Please try again.')
      }
    }
  }, [generatePDF])

  const renderCanvas = useCallback(() => (
    <div className={`${themes[formTheme].bg} ${themes[formTheme].text} shadow-lg rounded-lg overflow-hidden`}>
      <div className="p-4">
        <h2 className={`text-3xl font-bold text-center font-${fontStyle}`}>{formTitle}</h2>
        <p className={`text-center mt-2 text-sm font-${fontStyle}`}>{formDescription}</p>
      </div>
      <div 
        ref={canvasRef}
        className="w-full mx-auto p-4 space-y-4"
        style={{
          width: `${CANVAS_WIDTH}px`,
          maxWidth: '100%',
        }}
      >
        {elements.map((element) => (
          <FormElementComponent
            key={element.id}
            element={element}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onUpdateProperties={handleUpdateProperties}
            theme={formTheme}
            fontStyle={fontStyle}
          />
        ))}
      </div>
    </div>
  ), [elements, formTitle, formDescription, handleDelete, handleDuplicate, handleUpdateProperties, formTheme, fontStyle])

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-2xl font-bold text-gray-800">PDF Form Creator</h1>
      </header>
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-64 bg-white shadow-md p-4 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="design"><Layout className="h-4 w-4 mr-2" />Design</TabsTrigger>
              <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" />Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="design" className="space-y-4">
              <Button onClick={() => addElement('text')} className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" /> Text Field
              </Button>
              <Button onClick={() => addElement('checkbox')} className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" /> Checkbox
              </Button>
              <Button onClick={() => addElement('radio')} className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" /> Radio Buttons
              </Button>
              <Button onClick={() => addElement('dropdown')} className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" /> Dropdown
              </Button>
              <Button onClick={() => addElement('textarea')} className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" /> Textarea
              </Button>
              <Button onClick={() => addElement('freetext')} className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" /> Free Text
              </Button>
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-title">Form Title</Label>
                <Input
                  id="form-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-description">Form Description</Label>
                <Textarea
                  id="form-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-theme">Form Theme</Label>
                <Select value={formTheme} onValueChange={(value) => setFormTheme(value as keyof typeof themes)}>
                  <SelectTrigger id="form-theme">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="blue-gradient">Blue Gradient</SelectItem>
                    <SelectItem value="green-gradient">Green Gradient</SelectItem>
                    <SelectItem value="purple-gradient">Purple Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="font-style">Font Style</Label>
                <Select value={fontStyle} onValueChange={setFontStyle}>
                  <SelectTrigger id="font-style">
                    <SelectValue placeholder="Select a font style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="helvetica">Helvetica</SelectItem>
                    <SelectItem value="helvetica-bold">Helvetica Bold</SelectItem>
                    <SelectItem value="times-roman">Times Roman</SelectItem>
                    <SelectItem value="times-bold">Times Bold</SelectItem>
                    <SelectItem value="courier">Courier</SelectItem>
                    <SelectItem value="courier-bold">Courier Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo-upload">Upload Logo</Label>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                    <Image className="h-4 w-4 mr-2" />
                    {logo ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                  {logo && (
                    <Button onClick={() => setLogo(null)} variant="outline" className="text-red-500">
                      Remove Logo
                    </Button>
                  )}
                </div>
                <input
                  type="file"
                  id="logo-upload"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoUpload}

                />
                {logo && <p className="text-sm text-gray-500 mt-2">Logo uploaded: {logo.name}</p>}
              </div>
            </TabsContent>
          </Tabs>
        </aside>
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-4 flex justify-between items-center">
            <Button onClick={downloadPDF} disabled={isDownloading || elements.length === 0}>
              <Download className="h-4 w-4 mr-2" /> 
              {isDownloading ? 'Downloading...' : 'Download Fillable PDF'}
            </Button>
          </div>
          {isDownloading && (
            <div className="mb-4">
              <Progress value={downloadProgress} className="w-full" />
              <p className="text-sm text-gray-500 mt-2">Downloading: {Math.round(downloadProgress)}%</p>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          {renderCanvas()}
        </main>
      </div>
    </div>
  )
}