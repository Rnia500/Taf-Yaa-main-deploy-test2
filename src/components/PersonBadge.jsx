import React from 'react'
import Card from '../layout/containers/Card'


export const AdminBadge = ({position = '', padding = '10px',  margin = '0px', scared = false}) => (
    <Card backgroundColor="var(--color-gray)" positionType='absolute' padding={padding} margin={margin} position={position} borderRadius={scared ? '0px 0px 20px 20px' : '0px 20px 20px 20px'} size={30}>
        <img src='/SVGs/admin.svg' alt='Admin Badge' />
    </Card>
)

export const EditorBadge = ({position = '', padding = '3px',  margin = '0px', scared = false}) => (
    <Card backgroundColor="var(--color-gray)" positionType='absolute' padding={padding} margin={margin} position={position} borderRadius={scared ? '0px 0px 20px 20px' : '0px 20px 20px 20px'}  size={30}>
        <img src='/SVGs/editor.svg' alt='Editor Badge' />
    </Card>
)

export const ModeratorBadge = ({position = '', padding = '10px',  margin = '0px', scared = false}) => (
    <Card backgroundColor="var(--color-gray)" positionType='absolute' padding={padding} margin={margin} position={position} borderRadius={scared ? '0px 0px 20px 20px' : '0px 20px 20px 20px'} size={30}>
        <img src='/SVGs/moderator.svg' alt='Moderator Badge' />
    </Card>
)

export const ViewerBadge = ({position = '', padding = '0px',  margin = '0px', scared = false}) => (
    <Card backgroundColor="var(--color-gray)" positionType='absolute' padding={padding} margin={margin} position={position} borderRadius={scared ? '0px 0px 20px 20px' : '0px 20px 20px 20px'} size={30}>
        <img src='/SVGs/viewer.svg' alt='Viewer Badge'/>
    </Card>
)
